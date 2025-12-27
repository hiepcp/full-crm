using CRMSys.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace CRMSys.Infrastructure.BackgroundServices
{
    /// <summary>
    /// Hangfire background job for scheduled Dynamics 365 category synchronization
    /// </summary>
    public class Dynamics365CategorySyncJob
    {
        private readonly IDynamics365CategorySyncService _syncService;
        private readonly ILogger<Dynamics365CategorySyncJob> _logger;

        public Dynamics365CategorySyncJob(
            IDynamics365CategorySyncService syncService,
            ILogger<Dynamics365CategorySyncJob> logger)
        {
            _syncService = syncService;
            _logger = logger;
        }

        /// <summary>
        /// Executes the scheduled category synchronization between CRM and Dynamics 365
        /// This method is called by Hangfire RecurringJob scheduler
        /// </summary>
        public async Task ExecuteAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                _logger.LogInformation("Starting scheduled Dynamics 365 category synchronization");

                // Execute the bidirectional sync
                var auditLogId = await _syncService.SyncCategoriesAsync(cancellationToken);

                _logger.LogInformation(
                    "Scheduled Dynamics 365 category synchronization completed successfully. Audit Log ID: {AuditLogId}",
                    auditLogId);
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Dynamics 365 category synchronization was cancelled");
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing scheduled Dynamics 365 category synchronization");
                throw;
            }
        }
    }
}
