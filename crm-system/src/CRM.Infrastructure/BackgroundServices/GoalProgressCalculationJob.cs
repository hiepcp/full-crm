using CRMSys.Application.Interfaces;
using Dapper;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Shared.Dapper.Interfaces;

namespace CRMSys.Infrastructure.BackgroundServices
{
    /// <summary>
    /// Background job that recalculates all auto-calculated goals every 15 minutes as a fallback
    /// Implements distributed locking to prevent concurrent execution across multiple API instances
    /// </summary>
    public class GoalProgressCalculationJob : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<GoalProgressCalculationJob> _logger;
        private readonly TimeSpan _interval = TimeSpan.FromMinutes(15); // Every 15 minutes
        private readonly string _jobName = "goal-progress-calculation-job";

        public GoalProgressCalculationJob(
            IServiceProvider serviceProvider,
            ILogger<GoalProgressCalculationJob> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Wait a bit before first execution to avoid startup congestion
            await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);

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
                            await RecalculateAllGoalsAsync(scope.ServiceProvider, stoppingToken);
                        }
                        finally
                        {
                            await ReleaseLockAsync(unitOfWork, stoppingToken);
                        }
                    }
                    else
                    {
                        _logger.LogInformation("Goal calculation job is already running on another instance, skipping");
                    }
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Goal progress calculation job failed");
                }

                // Wait 15 minutes until next execution
                await Task.Delay(_interval, stoppingToken);
            }
        }

        private async Task RecalculateAllGoalsAsync(IServiceProvider serviceProvider, CancellationToken stoppingToken)
        {
            var startTime = DateTime.UtcNow;
            _logger.LogInformation("Starting scheduled goal progress recalculation");

            var calculationService = serviceProvider.GetRequiredService<IGoalProgressCalculationService>();

            var recalculatedCount = await calculationService.RecalculateAllAutoCalculatedGoalsAsync(stoppingToken);

            var duration = (DateTime.UtcNow - startTime).TotalSeconds;
            _logger.LogInformation(
                "Scheduled recalculation completed: {Count} goals recalculated in {Duration:F2}s",
                recalculatedCount, duration);
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
