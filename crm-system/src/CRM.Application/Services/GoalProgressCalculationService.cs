using CRMSys.Application.Interfaces;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Microsoft.Extensions.Logging;
using Shared.Dapper.Interfaces;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Service for automatically calculating goal progress from CRM data
    /// Implements hybrid event-driven + scheduled fallback pattern per research.md decision #1
    /// </summary>
    public class GoalProgressCalculationService : IGoalProgressCalculationService
    {
        private readonly IGoalRepository _goalRepository;
        private readonly IGoalProgressHistoryRepository _progressHistoryRepository;
        private readonly IGoalAuditLogRepository _auditLogRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<GoalProgressCalculationService> _logger;

        public GoalProgressCalculationService(
            IGoalRepository goalRepository,
            IGoalProgressHistoryRepository progressHistoryRepository,
            IGoalAuditLogRepository auditLogRepository,
            IUnitOfWork unitOfWork,
            ILogger<GoalProgressCalculationService> logger)
        {
            _goalRepository = goalRepository;
            _progressHistoryRepository = progressHistoryRepository;
            _auditLogRepository = auditLogRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<decimal> CalculateProgressAsync(long goalId, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(goalId, ct);
            if (goal == null)
            {
                _logger.LogWarning("Goal {GoalId} not found for progress calculation", goalId);
                return 0;
            }

            if (goal.CalculationSource != "auto_calculated")
            {
                _logger.LogInformation("Goal {GoalId} is manual entry, skipping auto-calculation", goalId);
                return goal.Progress;
            }

            try
            {
                var oldProgressPercentage = goal.ProgressPercentage;

                // Calculate based on goal type
                var calculatedProgress = goal.Type?.ToLower() switch
                {
                    "revenue" => await CalculateRevenueProgressAsync(goal, ct),
                    "deals" => await CalculateDealsProgressAsync(goal, ct),
                    "activities" => await CalculateActivitiesProgressAsync(goal, ct),
                    "tasks" => await CalculateTasksProgressAsync(goal, ct),
                    _ => throw new InvalidOperationException($"Unsupported goal type: {goal.Type}")
                };

                // Update goal
                goal.Progress = calculatedProgress;
                goal.LastCalculatedAt = DateTime.UtcNow;
                goal.CalculationFailed = false;
                goal.ManualOverrideReason = null; // Clear any previous override reason

                await _goalRepository.UpdateAsync(goal, ct);

                // Create snapshot if significant change
                await CreateSnapshotIfSignificantChangeAsync(goal, oldProgressPercentage, ct);

                // Create audit log entry
                await _auditLogRepository.CreateAsync(new GoalAuditLog
                {
                    GoalId = goalId,
                    EventType = "calculation_event",
                    BeforeValue = oldProgressPercentage.ToString("F2"),
                    AfterValue = goal.ProgressPercentage.ToString("F2"),
                    ChangeDetails = $"{{\"calculationType\":\"{goal.Type}\",\"calculatedValue\":{calculatedProgress}}}",
                    ChangedBy = null, // System event
                    ChangedOn = DateTime.UtcNow
                }, ct);

                _logger.LogInformation(
                    "Goal {GoalId} progress calculated successfully: {Progress}/{Target} ({Percentage}%)",
                    goalId, calculatedProgress, goal.TargetValue, goal.ProgressPercentage);

                return calculatedProgress;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to calculate progress for goal {GoalId}", goalId);

                // Mark calculation as failed
                goal.CalculationFailed = true;
                goal.LastCalculatedAt = DateTime.UtcNow;
                await _goalRepository.UpdateAsync(goal, ct);

                // Create audit log entry for failure
                await _auditLogRepository.CreateAsync(new GoalAuditLog
                {
                    GoalId = goalId,
                    EventType = "calculation_event",
                    ChangeDetails = $"{{\"error\":\"{ex.Message}\",\"failed\":true}}",
                    ChangedBy = null,
                    ChangedOn = DateTime.UtcNow
                }, ct);

                throw;
            }
        }

        public async Task<decimal> CalculateRevenueProgressAsync(Goal goal, CancellationToken ct = default)
        {
            // Query deals: Stage='Closed Won', CloseDate between goal.StartDate and goal.EndDate
            var sql = @"
                SELECT COALESCE(SUM(Amount), 0)
                FROM crm_deal
                WHERE Stage = 'Closed Won'
                  AND CloseDate >= @StartDate
                  AND CloseDate <= @EndDate
                  AND (@OwnerType != 'individual' OR OwnerId = @OwnerId)";

            var connection = _unitOfWork.Connection;
            var transaction = _unitOfWork.Transaction;

            var revenue = await connection.ExecuteScalarAsync<decimal>(sql, new
            {
                StartDate = goal.StartDate ?? DateTime.MinValue,
                EndDate = goal.EndDate ?? DateTime.MaxValue,
                OwnerType = goal.OwnerType,
                OwnerId = goal.OwnerId ?? 0
            }, transaction);

            return revenue;
        }

        public async Task<decimal> CalculateDealsProgressAsync(Goal goal, CancellationToken ct = default)
        {
            // Count deals with Stage='Closed Won' within goal date range
            var sql = @"
                SELECT COUNT(1)
                FROM crm_deal
                WHERE Stage = 'Closed Won'
                  AND CloseDate >= @StartDate
                  AND CloseDate <= @EndDate
                  AND (@OwnerType != 'individual' OR OwnerId = @OwnerId)";

            var connection = _unitOfWork.Connection;
            var transaction = _unitOfWork.Transaction;

            var count = await connection.ExecuteScalarAsync<int>(sql, new
            {
                StartDate = goal.StartDate ?? DateTime.MinValue,
                EndDate = goal.EndDate ?? DateTime.MaxValue,
                OwnerType = goal.OwnerType,
                OwnerId = goal.OwnerId ?? 0
            }, transaction);

            return count;
        }

        public async Task<decimal> CalculateActivitiesProgressAsync(Goal goal, CancellationToken ct = default)
        {
            // Count completed activities within goal date range
            var sql = @"
                SELECT COUNT(1)
                FROM crm_activity
                WHERE Status = 'Completed'
                  AND DueDate >= @StartDate
                  AND DueDate <= @EndDate
                  AND (@OwnerType != 'individual' OR OwnerId = @OwnerId)";

            var connection = _unitOfWork.Connection;
            var transaction = _unitOfWork.Transaction;

            var count = await connection.ExecuteScalarAsync<int>(sql, new
            {
                StartDate = goal.StartDate ?? DateTime.MinValue,
                EndDate = goal.EndDate ?? DateTime.MaxValue,
                OwnerType = goal.OwnerType,
                OwnerId = goal.OwnerId ?? 0
            }, transaction);

            return count;
        }

        public async Task<decimal> CalculateTasksProgressAsync(Goal goal, CancellationToken ct = default)
        {
            // Note: Assuming tasks are tracked in crm_activity with Type='Task'
            var sql = @"
                SELECT COUNT(1)
                FROM crm_activity
                WHERE Type = 'Task'
                  AND Status = 'Completed'
                  AND DueDate >= @StartDate
                  AND DueDate <= @EndDate
                  AND (@OwnerType != 'individual' OR OwnerId = @OwnerId)";

            var connection = _unitOfWork.Connection;
            var transaction = _unitOfWork.Transaction;

            var count = await connection.ExecuteScalarAsync<int>(sql, new
            {
                StartDate = goal.StartDate ?? DateTime.MinValue,
                EndDate = goal.EndDate ?? DateTime.MaxValue,
                OwnerType = goal.OwnerType,
                OwnerId = goal.OwnerId ?? 0
            }, transaction);

            return count;
        }

        public async Task CreateSnapshotIfSignificantChangeAsync(Goal goal, decimal oldProgressPercentage, CancellationToken ct = default)
        {
            var currentPercentage = goal.ProgressPercentage;
            var percentageChange = Math.Abs(currentPercentage - oldProgressPercentage);

            // Create snapshot if change >= 1%
            if (percentageChange >= 1.0m)
            {
                await _progressHistoryRepository.CreateAsync(new GoalProgressHistory
                {
                    GoalId = goal.Id,
                    ProgressValue = goal.Progress,
                    TargetValue = goal.TargetValue ?? 0,
                    ProgressPercentage = currentPercentage,
                    SnapshotSource = "significant_change",
                    SnapshotTimestamp = DateTime.UtcNow,
                    CreatedBy = null, // System-generated
                    Notes = $"Progress changed by {percentageChange:F2}%"
                }, ct);

                _logger.LogInformation(
                    "Created significant change snapshot for goal {GoalId}: {OldPercentage}% -> {NewPercentage}%",
                    goal.Id, oldProgressPercentage, currentPercentage);
            }
        }

        public async Task RecalculateGoalsForEntityAsync(string entityType, long entityId, CancellationToken ct = default)
        {
            // Find goals affected by this entity change
            var affectedGoals = new List<Goal>();

            switch (entityType.ToLower())
            {
                case "deal":
                    // Find revenue and deals goals that might be affected
                    var dealGoals = await _goalRepository.GetAutoCalculatedGoalsAsync(ct);
                    affectedGoals.AddRange(dealGoals.Where(g =>
                        (g.Type == "revenue" || g.Type == "deals") &&
                        g.Status == "active"));
                    break;

                case "activity":
                    // Find activities goals that might be affected
                    var activityGoals = await _goalRepository.GetAutoCalculatedGoalsAsync(ct);
                    affectedGoals.AddRange(activityGoals.Where(g =>
                        g.Type == "activities" &&
                        g.Status == "active"));
                    break;

                case "task":
                    // Find tasks goals that might be affected
                    var taskGoals = await _goalRepository.GetAutoCalculatedGoalsAsync(ct);
                    affectedGoals.AddRange(taskGoals.Where(g =>
                        g.Type == "tasks" &&
                        g.Status == "active"));
                    break;

                default:
                    _logger.LogWarning("Unknown entity type for goal recalculation: {EntityType}", entityType);
                    return;
            }

            _logger.LogInformation(
                "Recalculating {Count} goals affected by {EntityType} {EntityId}",
                affectedGoals.Count, entityType, entityId);

            // Recalculate each affected goal
            foreach (var goal in affectedGoals)
            {
                try
                {
                    await CalculateProgressAsync(goal.Id, ct);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to recalculate goal {GoalId}", goal.Id);
                    // Continue with other goals even if one fails
                }
            }
        }

        public async Task<int> RecalculateAllAutoCalculatedGoalsAsync(CancellationToken ct = default)
        {
            var goals = await _goalRepository.GetAutoCalculatedGoalsAsync(ct);
            var recalculatedCount = 0;

            _logger.LogInformation("Starting batch recalculation of {Count} auto-calculated goals", goals.Count());

            foreach (var goal in goals)
            {
                try
                {
                    await CalculateProgressAsync(goal.Id, ct);
                    recalculatedCount++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to recalculate goal {GoalId} in batch job", goal.Id);
                    // Continue with other goals
                }
            }

            _logger.LogInformation(
                "Batch recalculation completed: {Recalculated}/{Total} goals",
                recalculatedCount, goals.Count());

            return recalculatedCount;
        }
    }
}
