using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Shared.Dapper.Interfaces;

namespace CRMSys.Infrastructure.BackgroundServices
{
    /// <summary>
    /// Background job that creates daily progress snapshots for all active goals at midnight
    /// Implements distributed locking to prevent concurrent execution across multiple API instances
    /// </summary>
    public class GoalSnapshotJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<GoalSnapshotJob> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromHours(24); // Daily
        private readonly string _jobName = "goal-snapshot-job";

        public GoalSnapshotJob(
            IServiceProvider serviceProvider,
            ILogger<GoalSnapshotJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Wait until midnight to start first execution
            await WaitUntilMidnightAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    using var scope = _serviceProvider.CreateScope();
                    var unitOfWork = scope.ServiceProvider.GetRequiredService<IUnitOfWork>();

                    if (await AcquireLockAsync(unitOfWork, stoppingToken))
                    {
                        try
                        {
                            await CreateDailySnapshotsAsync(scope.ServiceProvider, stoppingToken);
                        }
                        finally
                        {
                            await ReleaseLockAsync(unitOfWork, stoppingToken);
                        }
                    }
                    else
                    {
                        _logger.LogInformation("Goal snapshot job is already running on another instance, skipping");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Goal snapshot job failed");
                }

                // Wait 24 hours until next execution
                await Task.Delay(_interval, stoppingToken);
            }
        }

        private async Task WaitUntilMidnightAsync(CancellationToken stoppingToken)
        {
            var now = DateTime.Now;
            var tomorrow = now.Date.AddDays(1);
            var delay = tomorrow - now;

            _logger.LogInformation("Goal snapshot job will start at midnight (in {Hours}h {Minutes}m)", delay.Hours, delay.Minutes);

            await Task.Delay(delay, stoppingToken);
        }

        private async Task CreateDailySnapshotsAsync(IServiceProvider serviceProvider, CancellationToken stoppingToken)
        {
            var startTime = DateTime.UtcNow;
            _logger.LogInformation("Starting daily goal snapshot creation");

            var goalRepository = serviceProvider.GetRequiredService<IGoalRepository>();
            var progressHistoryRepository = serviceProvider.GetRequiredService<IGoalProgressHistoryRepository>();

            // Get all active goals
            var goals = await goalRepository.GetAutoCalculatedGoalsAsync(stoppingToken);
            var activeGoals = goals.Where(g => g.Status == "active").ToList();

            var snapshotsCreated = 0;

            foreach (var goal in activeGoals)
            {
                try
                {
                    // Check if snapshot already created today
                    var lastSnapshot = await progressHistoryRepository.GetLatestForGoalAsync(goal.Id, stoppingToken);
                    if (lastSnapshot?.SnapshotTimestamp.Date == DateTime.UtcNow.Date)
                    {
                        // Already have snapshot for today, skip
                        continue;
                    }

                    // Create daily snapshot
                    await progressHistoryRepository.CreateAsync(new GoalProgressHistory
                    {
                        GoalId = goal.Id,
                        ProgressValue = goal.Progress,
                        TargetValue = goal.TargetValue ?? 0,
                        ProgressPercentage = goal.ProgressPercentage,
                        SnapshotSource = "daily_snapshot",
                        SnapshotTimestamp = DateTime.UtcNow,
                        CreatedBy = null, // System-generated
                        Notes = "Daily midnight snapshot"
                    }, stoppingToken);

                    snapshotsCreated++;
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to create snapshot for goal {GoalId}", goal.Id);
                    // Continue with other goals
                }
            }

            var duration = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogInformation(
                "Daily snapshot job completed: Created {Count} snapshots for {Total} active goals in {Duration:F2}s",
                snapshotsCreated, activeGoals.Count, duration);
        }

        private async Task<bool> AcquireLockAsync(IUnitOfWork unitOfWork, CancellationToken stoppingToken)
        {
            var instanceId = Environment.MachineName + "_" + Guid.NewGuid().ToString("N")[..8];
            var expiresAt = DateTime.UtcNow.AddMinutes(5); // Lock expires in 5 minutes

            var sql = @"
                UPDATE crm_background_job_lock
                SET LockedBy = @InstanceId,
                    LockedAt = @LockedAt,
                    ExpiresAt = @ExpiresAt
                WHERE JobName = @JobName
                  AND (LockedBy IS NULL OR ExpiresAt < @Now)";

            var rowsAffected = await unitOfWork.Connection.ExecuteAsync(sql, new
            {
                JobName = _jobName,
                InstanceId = instanceId,
                LockedAt = DateTime.UtcNow,
                ExpiresAt = expiresAt,
                Now = DateTime.UtcNow
            }, unitOfWork.Transaction);

            return rowsAffected > 0;
        }

        private async Task ReleaseLockAsync(IUnitOfWork unitOfWork, CancellationToken stoppingToken)
        {
            var sql = @"
                UPDATE crm_background_job_lock
                SET LockedBy = NULL,
                    LockedAt = NULL,
                    ExpiresAt = NULL
                WHERE JobName = @JobName";

            await unitOfWork.Connection.ExecuteAsync(sql, new { JobName = _jobName }, unitOfWork.Transaction);
        }
    }
}
