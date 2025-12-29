using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using Microsoft.Extensions.Logging;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;

namespace CRMSys.Application.Services
{
    public class GoalService : BaseService<Goal, long, CreateGoalRequest>, IGoalService
    {
        private readonly IGoalRepository _goalRepository;
        private readonly IGoalProgressHistoryRepository _progressHistoryRepository;
        private readonly IGoalAuditLogRepository _auditLogRepository;
        private readonly IGoalProgressCalculationService _calculationService;
        private readonly IGoalHierarchyService _hierarchyService;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateGoalRequest> _createValidator;
        private readonly IValidator<UpdateGoalRequest> _updateValidator;
        private readonly IValidator<ManualProgressAdjustmentRequest> _manualAdjustmentValidator;
        private readonly IUserRepository _userRepository;
        private readonly ILogger<GoalService> _logger;

        public GoalService(
            IRepository<Goal, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateGoalRequest> createValidator,
            IValidator<UpdateGoalRequest> updateValidator,
            IValidator<ManualProgressAdjustmentRequest> manualAdjustmentValidator,
            IGoalRepository goalRepository,
            IGoalProgressHistoryRepository progressHistoryRepository,
            IGoalAuditLogRepository auditLogRepository,
            IGoalProgressCalculationService calculationService,
            IGoalHierarchyService hierarchyService,
            IUserRepository userRepository,
            ILogger<GoalService> logger)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _goalRepository = goalRepository;
            _progressHistoryRepository = progressHistoryRepository;
            _auditLogRepository = auditLogRepository;
            _calculationService = calculationService;
            _hierarchyService = hierarchyService;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _manualAdjustmentValidator = manualAdjustmentValidator;
            _userRepository = userRepository;
            _logger = logger;
        }

        public async Task<PagedResult<GoalResponse>> QueryAsync(GoalQueryRequest request, CancellationToken ct = default)
        {
            var result = await _goalRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<GoalResponse>>(result.Items);

            return new PagedResult<GoalResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        public async Task<GoalResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            return goal == null ? null : _mapper.Map<GoalResponse>(goal);
        }

        public async Task<long> CreateAsync(CreateGoalRequest request, string userEmail, CancellationToken ct = default)
        {
            await _createValidator.ValidateAndThrowAsync(request, ct);

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);

            ApplyOwnershipDefaults(request, currentUser);
            EnsureDateRange(request.StartDate, request.EndDate);
            EnsureProgressRange(0); // New goals start with 0 progress
            await EnsureAuthorizationAsync(request.OwnerType, request.OwnerId, currentUser);

            return await base.AddAsync(request, userEmail, ct);
        }

        public async Task<bool> UpdateAsync(long id, UpdateGoalRequest request, string userEmail, CancellationToken ct = default)
        {
            var validationResult = await _updateValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            var existing = await _goalRepository.GetByIdAsync(id, ct);
            if (existing == null)
            {
                return false;
            }

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);

            ApplyOwnershipDefaults(request, currentUser);
            EnsureDateRange(request.StartDate, request.EndDate);
            if (request.Progress.HasValue)
            {
                EnsureProgressRange(request.Progress.Value);
            }
            await EnsureAuthorizationAsync(request.OwnerType, request.OwnerId, currentUser);

            var createDto = _mapper.Map<CreateGoalRequest>(request);
            try
            {
                await base.UpdateAsync(id, createDto, userEmail, ct);
                return true;
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
            catch
            {
                throw;
            }
        }

        override
        public async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return false;
            }

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);
            await EnsureAuthorizationAsync(goal.OwnerType, goal.OwnerId, currentUser);

            try
            {
                await base.DeleteAsync(id, userEmail, ct);
                return true;
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
        }

        public async Task<IEnumerable<GoalMetricsResponse>> GetMetricsAsync(GoalMetricsRequest request, CancellationToken ct = default)
        {
            var metrics = await _goalRepository.GetMetricsAsync(request, ct);

            // CompletionRate mirrors AverageProgress unless more context is added later
            foreach (var item in metrics)
            {
                item.CompletionRate = item.AverageProgress;
            }

            return metrics;
        }

        private void EnsureDateRange(DateTime? start, DateTime? end)
        {
            if (start.HasValue && end.HasValue && start.Value.Date > end.Value.Date)
            {
                throw new ValidationException("StartDate must be before or equal to EndDate.");
            }
        }

        private void EnsureProgressRange(decimal progress)
        {
            if (progress < 0 || progress > 100)
            {
                throw new ValidationException("Progress must be between 0 and 100.");
            }
        }

        private async Task EnsureAuthorizationAsync(string ownerType, long? ownerId, User? currentUser)
        {
            // Allow system jobs
            if (currentUser == null) return;

            var isManager = string.Equals(currentUser.Role, "admin", StringComparison.OrdinalIgnoreCase)
                            || string.Equals(currentUser.Role, "manager", StringComparison.OrdinalIgnoreCase);

            if (ownerType == "individual")
            {
                if (ownerId.HasValue && ownerId.Value != currentUser.Id && !isManager)
                {
                    throw new UnauthorizedAccessException("You are not allowed to modify another individual's goal.");
                }
            }
            else
            {
                if (!isManager)
                {
                    throw new UnauthorizedAccessException("Only managers or admins can modify team/company goals.");
                }
            }
        }

        private void ApplyOwnershipDefaults(CreateGoalRequest request, User? currentUser)
        {
            if (request.OwnerType == "individual" && !request.OwnerId.HasValue && currentUser != null)
            {
                request.OwnerId = currentUser.Id;
            }
        }

        private void ApplyOwnershipDefaults(UpdateGoalRequest request, User? currentUser)
        {
            if (request.OwnerType == "individual" && !request.OwnerId.HasValue && currentUser != null)
            {
                request.OwnerId = currentUser.Id;
            }
        }

        // === Business Logic Methods ===

        public async Task<bool> UpdateProgressAsync(long id, decimal progress, string userEmail, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return false;
            }

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);
            await EnsureAuthorizationAsync(goal.OwnerType, goal.OwnerId, currentUser);

            goal.UpdateProgress(progress);
            var result = await _goalRepository.UpdateAsync(goal, ct);

            // Recalculate parent progress if this goal has a parent
            if (result && goal.ParentGoalId.HasValue)
            {
                await _hierarchyService.RecalculateParentProgressAsync(goal.Id, ct);
            }

            return result;
        }

        public async Task<bool> ChangeStatusAsync(long id, string status, string userEmail, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return false;
            }

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);
            await EnsureAuthorizationAsync(goal.OwnerType, goal.OwnerId, currentUser);

            if (!goal.ChangeStatus(status))
            {
                return false; // Invalid status
            }

            return await _goalRepository.UpdateAsync(goal, ct);
        }

        public async Task<bool> CompleteGoalAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return false;
            }

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);
            await EnsureAuthorizationAsync(goal.OwnerType, goal.OwnerId, currentUser);

            goal.Complete();
            return await _goalRepository.UpdateAsync(goal, ct);
        }

        public async Task<bool> CancelGoalAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return false;
            }

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);
            await EnsureAuthorizationAsync(goal.OwnerType, goal.OwnerId, currentUser);

            goal.Cancel();
            return await _goalRepository.UpdateAsync(goal, ct);
        }

        // === Analytics/Reporting ===

        public async Task<Dictionary<string, int>> GetGoalsCountByStatusAsync(string? ownerType = null, CancellationToken ct = default)
        {
            // This would typically be implemented in the repository with a custom query
            // For now, returning empty dictionary as placeholder
            return new Dictionary<string, int>();
        }

        public async Task<Dictionary<string, decimal>> GetGoalsProgressByTypeAsync(string? ownerType = null, CancellationToken ct = default)
        {
            // This would typically be implemented in the repository with a custom query
            // For now, returning empty dictionary as placeholder
            return new Dictionary<string, decimal>();
        }

        public async Task<List<GoalResponse>> GetOverdueGoalsAsync(string? ownerType = null, CancellationToken ct = default)
        {
            // This would typically be implemented in the repository with a custom query
            // For now, returning empty list as placeholder
            return new List<GoalResponse>();
        }

        public async Task<List<GoalResponse>> GetTopPerformingGoalsAsync(int limit = 10, string? ownerType = null, CancellationToken ct = default)
        {
            // This would typically be implemented in the repository with a custom query
            // For now, returning empty list as placeholder
            return new List<GoalResponse>();
        }

        // === Auto-Calculation Support (US1) ===

        public async Task<GoalResponse?> ManualAdjustProgressAsync(long id, ManualProgressAdjustmentRequest request, string userEmail, CancellationToken ct = default)
        {
            await _manualAdjustmentValidator.ValidateAndThrowAsync(request, ct);

            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return null;
            }

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);
            await EnsureAuthorizationAsync(goal.OwnerType, goal.OwnerId, currentUser);

            var oldProgressPercentage = goal.ProgressPercentage;

            // Update progress with manual override
            goal.Progress = request.NewProgress;
            goal.CalculationSource = "manual";
            goal.ManualOverrideReason = request.Justification;
            goal.LastCalculatedAt = DateTime.UtcNow;
            goal.UpdatedBy = userEmail;
            goal.UpdatedOn = DateTime.UtcNow;

            await _goalRepository.UpdateAsync(goal, ct);

            // Create snapshot for manual adjustment
            await _progressHistoryRepository.CreateAsync(new GoalProgressHistory
            {
                GoalId = goal.Id,
                ProgressValue = goal.Progress,
                TargetValue = goal.TargetValue ?? 0,
                ProgressPercentage = goal.ProgressPercentage,
                SnapshotSource = "manual_adjustment",
                SnapshotTimestamp = DateTime.UtcNow,
                CreatedBy = currentUser?.Id,
                Notes = $"Manual adjustment: {request.Justification}"
            }, ct);

            // Create audit log entry
            await CreateAuditLogEntry(
                goalId: goal.Id,
                eventType: "manual_adjustment",
                beforeValue: oldProgressPercentage.ToString("F2"),
                afterValue: goal.ProgressPercentage.ToString("F2"),
                changeDetails: $"{{\"justification\":\"{request.Justification}\",\"newProgress\":{request.NewProgress}}}",
                changedBy: userEmail,
                ct: ct);

            _logger.LogInformation(
                "Manual progress adjustment for goal {GoalId} by {UserEmail}: {OldPercentage}% -> {NewPercentage}%",
                goal.Id, userEmail, oldProgressPercentage, goal.ProgressPercentage);

            return _mapper.Map<GoalResponse>(goal);
        }

        public async Task<GoalResponse?> RecalculateProgressAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return null;
            }

            var currentUser = await _userRepository.GetByEmailAsync(userEmail, ct);
            await EnsureAuthorizationAsync(goal.OwnerType, goal.OwnerId, currentUser);

            if (goal.CalculationSource != "auto_calculated")
            {
                throw new InvalidOperationException("Cannot recalculate manually-entered goals. Use manual adjustment endpoint instead.");
            }

            // Trigger recalculation via calculation service
            await _calculationService.CalculateProgressAsync(id, ct);

            // Reload goal to get updated values
            goal = await _goalRepository.GetByIdAsync(id, ct);

            _logger.LogInformation(
                "Manual recalculation triggered for goal {GoalId} by {UserEmail}",
                id, userEmail);

            return _mapper.Map<GoalResponse>(goal);
        }

        public async Task<GoalForecastResponse?> GetForecastAsync(long id, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return null;
            }

            // Get historical snapshots for velocity calculation
            var history = await _progressHistoryRepository.GetByGoalIdAsync(id, ct);
            var historyList = history.OrderBy(h => h.SnapshotTimestamp).ToList();

            if (historyList.Count < 2)
            {
                // Not enough data for velocity analysis
                return new GoalForecastResponse
                {
                    GoalId = goal.Id,
                    CurrentProgress = goal.Progress,
                    TargetValue = goal.TargetValue ?? 0,
                    ProgressPercentage = goal.ProgressPercentage,
                    DaysRemaining = goal.EndDate.HasValue ? (goal.EndDate.Value.Date - DateTime.UtcNow.Date).Days : 0,
                    ForecastStatus = "insufficient_data",
                    ConfidenceLevel = "low",
                    DataPointsCount = historyList.Count,
                    Message = "Insufficient historical data for accurate forecasting (minimum 2 data points required)"
                };
            }

            // Calculate velocities
            var dailyChanges = new List<decimal>();
            for (int i = 1; i < historyList.Count; i++)
            {
                var previous = historyList[i - 1];
                var current = historyList[i];
                var daysDiff = (current.SnapshotTimestamp - previous.SnapshotTimestamp).TotalDays;
                if (daysDiff > 0)
                {
                    var progressChange = current.ProgressValue - previous.ProgressValue;
                    dailyChanges.Add(progressChange / (decimal)daysDiff);
                }
            }

            var dailyVelocity = dailyChanges.Any() ? dailyChanges.Average() : 0;
            var weeklyVelocity = dailyVelocity * 7;

            var remaining = (goal.TargetValue ?? 0) - goal.Progress;
            var daysRemaining = goal.EndDate.HasValue ? (goal.EndDate.Value.Date - DateTime.UtcNow.Date).Days : 0;

            DateTime? estimatedCompletion = null;
            decimal requiredDailyVelocity = 0;
            string forecastStatus = "on_track";

            if (daysRemaining > 0)
            {
                requiredDailyVelocity = remaining / daysRemaining;

                if (dailyVelocity > 0)
                {
                    var daysToComplete = remaining / dailyVelocity;
                    estimatedCompletion = DateTime.UtcNow.Date.AddDays((double)daysToComplete);

                    if (estimatedCompletion <= goal.EndDate)
                    {
                        forecastStatus = dailyVelocity >= requiredDailyVelocity * 1.2m ? "ahead" : "on_track";
                    }
                    else
                    {
                        forecastStatus = "behind";
                    }
                }
                else if (dailyVelocity < 0)
                {
                    forecastStatus = "at_risk";
                }
                else
                {
                    forecastStatus = remaining > 0 ? "at_risk" : "on_track";
                }
            }

            var confidenceLevel = historyList.Count >= 10 ? "high" : historyList.Count >= 5 ? "medium" : "low";

            return new GoalForecastResponse
            {
                GoalId = goal.Id,
                CurrentProgress = goal.Progress,
                TargetValue = goal.TargetValue ?? 0,
                ProgressPercentage = goal.ProgressPercentage,
                DailyVelocity = dailyVelocity,
                WeeklyVelocity = weeklyVelocity,
                RequiredDailyVelocity = requiredDailyVelocity,
                EstimatedCompletionDate = estimatedCompletion,
                DaysRemaining = daysRemaining,
                ForecastStatus = forecastStatus,
                ConfidenceLevel = confidenceLevel,
                DataPointsCount = historyList.Count
            };
        }

        public async Task<IEnumerable<GoalProgressHistory>> GetProgressHistoryAsync(long id, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(id, ct);
            if (goal == null)
            {
                return Enumerable.Empty<GoalProgressHistory>();
            }

            return await _progressHistoryRepository.GetByGoalIdAsync(id, ct);
        }

        // === Helper Methods ===

        private async Task CreateAuditLogEntry(
            long goalId,
            string eventType,
            string? beforeValue,
            string? afterValue,
            string? changeDetails,
            string? changedBy,
            CancellationToken ct = default)
        {
            // Get user ID from email if provided
            long? changedById = null;
            if (!string.IsNullOrEmpty(changedBy))
            {
                var user = await _userRepository.GetByEmailAsync(changedBy, ct);
                changedById = user?.Id;
            }

            await _auditLogRepository.CreateAsync(new GoalAuditLog
            {
                GoalId = goalId,
                EventType = eventType,
                BeforeValue = beforeValue,
                AfterValue = afterValue,
                ChangeDetails = changeDetails,
                ChangedBy = changedById,
                ChangedOn = DateTime.UtcNow
            }, ct);
        }

        // === Goal Hierarchy Support (US4) ===

        public async Task<GoalResponse?> LinkToParentAsync(long childGoalId, LinkGoalToParentRequest request, string userEmail, CancellationToken ct = default)
        {
            return await _hierarchyService.LinkToParentAsync(childGoalId, request.ParentGoalId, userEmail, ct);
        }

        public async Task<GoalResponse?> UnlinkFromParentAsync(long childGoalId, string userEmail, CancellationToken ct = default)
        {
            return await _hierarchyService.UnlinkFromParentAsync(childGoalId, userEmail, ct);
        }

        public async Task<GoalHierarchyResponse?> GetHierarchyAsync(long goalId, CancellationToken ct = default)
        {
            return await _hierarchyService.GetHierarchyAsync(goalId, ct);
        }

        public async Task<IEnumerable<GoalResponse>> GetChildrenAsync(long parentGoalId, CancellationToken ct = default)
        {
            return await _hierarchyService.GetChildrenAsync(parentGoalId, ct);
        }

        // === Analytics & Insights (US5) ===

        public async Task<GoalAnalyticsResponse> GetAnalyticsAsync(GoalQueryRequest request, CancellationToken ct = default)
        {
            // Fetch all goals matching the query
            var queryResult = await _goalRepository.QueryAsync(request, ct);
            var goals = queryResult.Items.ToList();

            if (!goals.Any())
            {
                return new GoalAnalyticsResponse
                {
                    HasSufficientData = false,
                    DaysOfHistory = 0
                };
            }

            // Calculate summary metrics
            var totalGoals = goals.Count;
            var completedGoals = goals.Count(g => g.Status == "completed" || g.ProgressPercentage >= 100);
            var activeGoals = goals.Count(g => g.Status == "active");
            var cancelledGoals = goals.Count(g => g.Status == "cancelled");
            var overallCompletionRate = totalGoals > 0 ? (decimal)completedGoals / totalGoals * 100 : 0;
            var avgProgress = totalGoals > 0 ? goals.Average(g => g.ProgressPercentage) : 0;

            // Calculate days of history
            var oldestGoalDate = goals
                .Where(g => g.CreatedOn != default)
                .OrderBy(g => g.CreatedOn)
                .Select(g => g.CreatedOn)
                .FirstOrDefault();

            var daysOfHistory = oldestGoalDate != default
                ? (int)(DateTime.UtcNow - oldestGoalDate).TotalDays
                : 0;

            var hasSufficientData = daysOfHistory >= 30;

            // Calculate completion rate trend (monthly)
            var completionTrend = CalculateCompletionRateTrend(goals);

            // Calculate goal type breakdown
            var typeBreakdown = CalculateGoalTypeBreakdown(goals);

            // Calculate average velocity from progress history
            var velocity = await CalculateAverageVelocityAsync(goals, ct);

            // Calculate team/company comparisons (if requested)
            decimal? teamAvgCompletion = null;
            decimal? companyAvgCompletion = null;
            decimal? teamAvgVelocity = null;
            decimal? companyAvgVelocity = null;

            if (request.OwnerType == "individual")
            {
                // Get team average
                var teamGoalsQuery = new GoalQueryRequest
                {
                    OwnerType = "team",
                    Page = 1,
                    PageSize = 10000
                };
                var teamResult = await _goalRepository.QueryAsync(teamGoalsQuery, ct);
                var teamGoals = teamResult.Items.ToList();
                if (teamGoals.Any())
                {
                    teamAvgCompletion = (decimal)teamGoals.Count(g => g.Status == "completed" || g.ProgressPercentage >= 100) / teamGoals.Count * 100;
                    var teamVelocityResult = await CalculateAverageVelocityAsync(teamGoals, ct);
                    teamAvgVelocity = teamVelocityResult.AverageVelocity;
                }

                // Get company average
                var companyGoalsQuery = new GoalQueryRequest
                {
                    OwnerType = "company",
                    Page = 1,
                    PageSize = 10000
                };
                var companyResult = await _goalRepository.QueryAsync(companyGoalsQuery, ct);
                var companyGoals = companyResult.Items.ToList();
                if (companyGoals.Any())
                {
                    companyAvgCompletion = (decimal)companyGoals.Count(g => g.Status == "completed" || g.ProgressPercentage >= 100) / companyGoals.Count * 100;
                    var companyVelocityResult = await CalculateAverageVelocityAsync(companyGoals, ct);
                    companyAvgVelocity = companyVelocityResult.AverageVelocity;
                }
            }

            return new GoalAnalyticsResponse
            {
                TotalGoals = totalGoals,
                CompletedGoals = completedGoals,
                ActiveGoals = activeGoals,
                CancelledGoals = cancelledGoals,
                OverallCompletionRate = overallCompletionRate,
                AverageProgress = avgProgress,
                AverageVelocity = velocity.AverageVelocity,
                VelocityDataPoints = velocity.DataPoints,
                CompletionRateTrend = completionTrend,
                TypeBreakdown = typeBreakdown,
                TeamAverageCompletionRate = teamAvgCompletion,
                CompanyAverageCompletionRate = companyAvgCompletion,
                TeamAverageVelocity = teamAvgVelocity,
                CompanyAverageVelocity = companyAvgVelocity,
                HasSufficientData = hasSufficientData,
                OldestGoalDate = oldestGoalDate != default ? oldestGoalDate : null,
                DaysOfHistory = daysOfHistory
            };
        }

        private List<CompletionRateTrendPoint> CalculateCompletionRateTrend(List<Goal> goals)
        {
            var monthlyData = new Dictionary<string, (int Total, int Completed)>();

            foreach (var goal in goals.Where(g => g.EndDate.HasValue))
            {
                var monthKey = goal.EndDate!.Value.ToString("yyyy-MM");

                if (!monthlyData.ContainsKey(monthKey))
                {
                    monthlyData[monthKey] = (0, 0);
                }

                var current = monthlyData[monthKey];
                monthlyData[monthKey] = (
                    current.Total + 1,
                    current.Completed + (goal.Status == "completed" || goal.ProgressPercentage >= 100 ? 1 : 0)
                );
            }

            // Get last 12 months
            var sortedMonths = monthlyData.Keys.OrderBy(k => k).ToList();
            var last12Months = sortedMonths.Count > 12 ? sortedMonths.Skip(sortedMonths.Count - 12).ToList() : sortedMonths;

            return last12Months.Select(month =>
            {
                var data = monthlyData[month];
                return new CompletionRateTrendPoint
                {
                    Month = month,
                    TotalGoals = data.Total,
                    CompletedGoals = data.Completed,
                    CompletionRate = data.Total > 0 ? (decimal)data.Completed / data.Total * 100 : 0
                };
            }).ToList();
        }

        private List<GoalTypeBreakdown> CalculateGoalTypeBreakdown(List<Goal> goals)
        {
            var typeGroups = goals.GroupBy(g => g.Type ?? "unknown");

            return typeGroups.Select(group =>
            {
                var totalGoals = group.Count();
                var completedGoals = group.Count(g => g.Status == "completed" || g.ProgressPercentage >= 100);
                var avgProgress = totalGoals > 0 ? group.Average(g => g.ProgressPercentage) : 0;

                return new GoalTypeBreakdown
                {
                    Type = group.Key,
                    TotalGoals = totalGoals,
                    CompletedGoals = completedGoals,
                    CompletionRate = totalGoals > 0 ? (decimal)completedGoals / totalGoals * 100 : 0,
                    AverageProgress = avgProgress
                };
            }).OrderByDescending(t => t.TotalGoals).ToList();
        }

        private async Task<(decimal AverageVelocity, int DataPoints)> CalculateAverageVelocityAsync(List<Goal> goals, CancellationToken ct)
        {
            var velocities = new List<decimal>();

            foreach (var goal in goals.Where(g => g.StartDate.HasValue && g.Progress > 0))
            {
                var history = await _progressHistoryRepository.GetByGoalIdAsync(goal.Id, ct);
                var historyList = history.ToList();

                if (!historyList.Any())
                {
                    // Fallback: calculate from goal start date and current progress
                    var daysElapsed = (DateTime.UtcNow - goal.StartDate!.Value).TotalDays;
                    if (daysElapsed > 0)
                    {
                        var velocity = goal.ProgressPercentage / (decimal)daysElapsed;
                        if (velocity > 0)
                        {
                            velocities.Add(velocity);
                        }
                    }
                }
                else
                {
                    // Calculate from progress history snapshots
                    var sortedHistory = historyList.OrderBy(h => h.SnapshotTimestamp).ToList();
                    for (int i = 1; i < sortedHistory.Count; i++)
                    {
                        var prev = sortedHistory[i - 1];
                        var curr = sortedHistory[i];
                        var daysDiff = (curr.SnapshotTimestamp - prev.SnapshotTimestamp).TotalDays;

                        if (daysDiff > 0)
                        {
                            var progressDiff = curr.ProgressPercentage - prev.ProgressPercentage;
                            var velocity = progressDiff / (decimal)daysDiff;
                            if (velocity > 0)
                            {
                                velocities.Add(velocity);
                            }
                        }
                    }
                }
            }

            var avgVelocity = velocities.Any() ? velocities.Average() : 0;
            return (avgVelocity, velocities.Count);
        }
    }
}
