using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Shared.Dapper.Interfaces;
using System.Text;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Service for synchronizing categories between CRM and Dynamics 365
    /// Implements bidirectional sync with conflict resolution and audit logging
    /// </summary>
    public class Dynamics365CategorySyncService : IDynamics365CategorySyncService
    {
        private readonly IDynamics365CategorySyncRepository _syncRepository;
        private readonly ICategorySyncAuditLogRepository _auditLogRepository;
        private readonly ICategoryMappingRepository _mappingRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<Dynamics365CategorySyncService> _logger;
        private readonly IConfiguration _configuration;

        // Configuration constants
        private const string SYNC_STATUS_COMPLETED = "Completed";
        private const string SYNC_STATUS_FAILED = "Failed";
        private const string SYNC_STATUS_RUNNING = "Running";
        private const string SYNC_DIRECTION_BIDIRECTIONAL = "Bidirectional";
        private const string SYNC_DIRECTION_CRM_TO_D365 = "CRMToD365";
        private const string SYNC_DIRECTION_D365_TO_CRM = "D365ToCRM";
        private const string TRIGGER_SOURCE_MANUAL = "Manual";
        private const string TRIGGER_SOURCE_SCHEDULED = "Scheduled";
        private const int MAX_RETRY_COUNT = 3;
        private const int RETRY_DELAY_MINUTES = 15;

        public Dynamics365CategorySyncService(
            IDynamics365CategorySyncRepository syncRepository,
            ICategorySyncAuditLogRepository auditLogRepository,
            ICategoryMappingRepository mappingRepository,
            IUnitOfWork unitOfWork,
            ILogger<Dynamics365CategorySyncService> logger,
            IConfiguration configuration)
        {
            _syncRepository = syncRepository;
            _auditLogRepository = auditLogRepository;
            _mappingRepository = mappingRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
            _configuration = configuration;
        }

        /// <summary>
        /// Executes bidirectional category synchronization between CRM and Dynamics 365
        /// </summary>
        public async Task<long> SyncCategoriesAsync(CancellationToken ct = default)
        {
            _logger.LogInformation("Starting bidirectional category synchronization");

            var auditLog = new CategorySyncAuditLog
            {
                SyncStartedOn = DateTime.UtcNow,
                SyncStatus = SYNC_STATUS_RUNNING,
                SyncDirection = SYNC_DIRECTION_BIDIRECTIONAL,
                TriggerSource = TRIGGER_SOURCE_SCHEDULED,
                CreatedOn = DateTime.UtcNow,
                UpdatedOn = DateTime.UtcNow
            };

            try
            {
                _unitOfWork.BeginTransaction();

                // Create initial audit log entry
                var auditLogId = await _auditLogRepository.CreateAsync(auditLog, ct);
                auditLog.Id = auditLogId;

                // Sync CRM to D365
                var crmToD365Count = await SyncCategoriesToD365Async(ct);
                auditLog.CategoriesCreated += crmToD365Count;

                // Sync D365 to CRM
                var d365ToCrmCount = await SyncCategoriesFromD365Async(ct);
                auditLog.CategoriesCreated += d365ToCrmCount;

                // Mark sync as completed
                auditLog.SyncStatus = SYNC_STATUS_COMPLETED;
                auditLog.SyncCompletedOn = DateTime.UtcNow;
                auditLog.ChangesSummary = $"Synced {crmToD365Count} categories from CRM to D365, {d365ToCrmCount} from D365 to CRM";
                auditLog.UpdatedOn = DateTime.UtcNow;

                await _auditLogRepository.UpdateAsync(auditLog, ct);

                _unitOfWork.Commit();

                _logger.LogInformation("Bidirectional category synchronization completed successfully. Audit Log ID: {AuditLogId}", auditLogId);

                return auditLogId;
            }
            catch (Exception ex)
            {
                _unitOfWork.Rollback();

                _logger.LogError(ex, "Error during bidirectional category synchronization");

                auditLog.SyncStatus = SYNC_STATUS_FAILED;
                auditLog.SyncCompletedOn = DateTime.UtcNow;
                auditLog.ErrorsEncountered = 1;
                auditLog.ErrorDetails = $"{ex.Message}\n{ex.StackTrace}";
                auditLog.UpdatedOn = DateTime.UtcNow;

                // Try to update audit log with error (in new transaction)
                try
                {
                    _unitOfWork.BeginTransaction();
                    await _auditLogRepository.UpdateAsync(auditLog, ct);
                    _unitOfWork.Commit();
                }
                catch (Exception logEx)
                {
                    _logger.LogError(logEx, "Failed to update audit log with error details");
                    _unitOfWork.Rollback();
                }

                throw;
            }
        }

        /// <summary>
        /// Synchronizes categories from CRM to Dynamics 365
        /// </summary>
        public async Task<int> SyncCategoriesToD365Async(CancellationToken ct = default)
        {
            _logger.LogInformation("Syncing categories from CRM to Dynamics 365");

            var syncedCount = 0;

            try
            {
                // TODO: Implement actual sync logic
                // This is a placeholder that will be enhanced with:
                // 1. Fetch categories from CRM database
                // 2. Check sync state for each category
                // 3. Apply category mappings
                // 4. Push to D365 via IDynamicService
                // 5. Update sync state

                _logger.LogInformation("Synced {Count} categories from CRM to D365", syncedCount);

                return syncedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing categories from CRM to Dynamics 365");
                throw;
            }
        }

        /// <summary>
        /// Synchronizes categories from Dynamics 365 to CRM
        /// </summary>
        public async Task<int> SyncCategoriesFromD365Async(CancellationToken ct = default)
        {
            _logger.LogInformation("Syncing categories from Dynamics 365 to CRM");

            var syncedCount = 0;

            try
            {
                // TODO: Implement actual sync logic
                // This is a placeholder that will be enhanced with:
                // 1. Fetch categories from D365 via IDynamicService
                // 2. Check sync state for each category
                // 3. Apply category mappings (reverse direction)
                // 4. Create/update in CRM database
                // 5. Update sync state

                _logger.LogInformation("Synced {Count} categories from D365 to CRM", syncedCount);

                return syncedCount;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error syncing categories from Dynamics 365 to CRM");
                throw;
            }
        }

        /// <summary>
        /// Gets the status of the last sync operation
        /// </summary>
        public async Task<SyncStatusDto> GetSyncStatusAsync(CancellationToken ct = default)
        {
            try
            {
                var mostRecentSync = await _auditLogRepository.GetMostRecentAsync(ct);

                if (mostRecentSync == null)
                {
                    return new SyncStatusDto
                    {
                        SyncStatus = "Never Run",
                        IsRunning = false
                    };
                }

                // Calculate next scheduled sync based on configuration
                var scheduleCron = _configuration.GetValue<string>("Dynamics365Sync:ScheduleCron") ?? "0 */6 * * *";
                var nextScheduledSync = CalculateNextScheduledSync(scheduleCron, mostRecentSync.SyncCompletedOn ?? mostRecentSync.SyncStartedOn);

                return new SyncStatusDto
                {
                    LastSyncTime = mostRecentSync.SyncStartedOn,
                    SyncStatus = mostRecentSync.SyncStatus,
                    NextScheduledSync = nextScheduledSync,
                    IsRunning = mostRecentSync.SyncStatus == SYNC_STATUS_RUNNING,
                    LastSyncError = mostRecentSync.ErrorDetails,
                    LastSyncCategoriesCreated = mostRecentSync.CategoriesCreated,
                    LastSyncCategoriesUpdated = mostRecentSync.CategoriesUpdated,
                    LastSyncConflictsResolved = mostRecentSync.ConflictsResolved
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting sync status");
                throw;
            }
        }

        /// <summary>
        /// Gets the most recent sync audit log entry
        /// </summary>
        public async Task<CategorySyncAuditLog?> GetMostRecentSyncAsync(CancellationToken ct = default)
        {
            try
            {
                return await _auditLogRepository.GetMostRecentAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting most recent sync");
                throw;
            }
        }

        /// <summary>
        /// Gets paginated audit log entries
        /// </summary>
        public async Task<PaginatedResult<CategorySyncAuditLog>> GetAuditLogAsync(int page, int pageSize, CancellationToken ct = default)
        {
            try
            {
                var logs = await _auditLogRepository.GetPaginatedAsync(page, pageSize, ct);
                var totalCount = await _auditLogRepository.GetTotalCountAsync(ct);

                return new PaginatedResult<CategorySyncAuditLog>
                {
                    Items = logs,
                    TotalCount = totalCount,
                    Page = page,
                    PageSize = pageSize
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting audit log. Page: {Page}, PageSize: {PageSize}", page, pageSize);
                throw;
            }
        }

        /// <summary>
        /// Triggers manual sync operation
        /// </summary>
        public async Task<long> TriggerManualSyncAsync(string triggeredBy, CancellationToken ct = default)
        {
            _logger.LogInformation("Manual sync triggered by {TriggeredBy}", triggeredBy);

            var auditLog = new CategorySyncAuditLog
            {
                SyncStartedOn = DateTime.UtcNow,
                SyncStatus = SYNC_STATUS_RUNNING,
                SyncDirection = SYNC_DIRECTION_BIDIRECTIONAL,
                TriggerSource = TRIGGER_SOURCE_MANUAL,
                TriggeredBy = triggeredBy,
                CreatedOn = DateTime.UtcNow,
                UpdatedOn = DateTime.UtcNow
            };

            try
            {
                _unitOfWork.BeginTransaction();

                var auditLogId = await _auditLogRepository.CreateAsync(auditLog, ct);
                auditLog.Id = auditLogId;

                // Sync CRM to D365
                var crmToD365Count = await SyncCategoriesToD365Async(ct);
                auditLog.CategoriesCreated += crmToD365Count;

                // Sync D365 to CRM
                var d365ToCrmCount = await SyncCategoriesFromD365Async(ct);
                auditLog.CategoriesCreated += d365ToCrmCount;

                // Mark sync as completed
                auditLog.SyncStatus = SYNC_STATUS_COMPLETED;
                auditLog.SyncCompletedOn = DateTime.UtcNow;
                auditLog.ChangesSummary = $"Manual sync: {crmToD365Count} categories from CRM to D365, {d365ToCrmCount} from D365 to CRM";
                auditLog.UpdatedOn = DateTime.UtcNow;

                await _auditLogRepository.UpdateAsync(auditLog, ct);

                _unitOfWork.Commit();

                _logger.LogInformation("Manual sync completed successfully. Audit Log ID: {AuditLogId}", auditLogId);

                return auditLogId;
            }
            catch (Exception ex)
            {
                _unitOfWork.Rollback();

                _logger.LogError(ex, "Error during manual sync");

                auditLog.SyncStatus = SYNC_STATUS_FAILED;
                auditLog.SyncCompletedOn = DateTime.UtcNow;
                auditLog.ErrorsEncountered = 1;
                auditLog.ErrorDetails = $"{ex.Message}\n{ex.StackTrace}";
                auditLog.UpdatedOn = DateTime.UtcNow;

                // Try to update audit log with error (in new transaction)
                try
                {
                    _unitOfWork.BeginTransaction();
                    await _auditLogRepository.UpdateAsync(auditLog, ct);
                    _unitOfWork.Commit();
                }
                catch (Exception logEx)
                {
                    _logger.LogError(logEx, "Failed to update audit log with error details");
                    _unitOfWork.Rollback();
                }

                throw;
            }
        }

        /// <summary>
        /// Validates sync configuration and D365 connectivity
        /// </summary>
        public async Task<bool> ValidateConfigurationAsync(CancellationToken ct = default)
        {
            try
            {
                // Check required configuration
                var syncEnabled = _configuration.GetValue<bool>("Dynamics365Sync:Enabled");
                if (!syncEnabled)
                {
                    _logger.LogWarning("Dynamics 365 sync is disabled in configuration");
                    return false;
                }

                var masterSource = _configuration.GetValue<string>("Dynamics365Sync:MasterSource");
                if (string.IsNullOrEmpty(masterSource))
                {
                    _logger.LogWarning("Master source not configured");
                    return false;
                }

                var apiUrl = _configuration.GetValue<string>("Dynamics:ApiUrl");
                if (string.IsNullOrEmpty(apiUrl))
                {
                    _logger.LogWarning("Dynamics 365 API URL not configured");
                    return false;
                }

                // TODO: Add D365 connectivity check via IDynamicService

                _logger.LogInformation("Configuration validation passed");
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating configuration");
                return false;
            }
        }

        /// <summary>
        /// Gets all category mappings
        /// </summary>
        public async Task<IEnumerable<CategoryMapping>> GetCategoryMappingsAsync(CancellationToken ct = default)
        {
            try
            {
                return await _mappingRepository.GetAllActiveAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting category mappings");
                throw;
            }
        }

        /// <summary>
        /// Creates or updates a category mapping
        /// </summary>
        public async Task<long> SaveCategoryMappingAsync(CategoryMapping mapping, CancellationToken ct = default)
        {
            try
            {
                _unitOfWork.BeginTransaction();

                long mappingId;

                if (mapping.Id > 0)
                {
                    // Update existing mapping
                    mapping.UpdatedOn = DateTime.UtcNow;
                    await _mappingRepository.UpdateAsync(mapping, ct);
                    mappingId = mapping.Id;

                    _logger.LogInformation("Updated category mapping ID: {MappingId}", mappingId);
                }
                else
                {
                    // Create new mapping
                    mapping.CreatedOn = DateTime.UtcNow;
                    mapping.UpdatedOn = DateTime.UtcNow;
                    mappingId = await _mappingRepository.CreateAsync(mapping, ct);

                    _logger.LogInformation("Created category mapping ID: {MappingId}", mappingId);
                }

                _unitOfWork.Commit();

                return mappingId;
            }
            catch (Exception ex)
            {
                _unitOfWork.Rollback();
                _logger.LogError(ex, "Error saving category mapping");
                throw;
            }
        }

        /// <summary>
        /// Deletes a category mapping
        /// </summary>
        public async Task<bool> DeleteCategoryMappingAsync(long mappingId, CancellationToken ct = default)
        {
            try
            {
                _unitOfWork.BeginTransaction();

                var result = await _mappingRepository.DeleteAsync(mappingId, ct);

                _unitOfWork.Commit();

                _logger.LogInformation("Deleted category mapping ID: {MappingId}", mappingId);

                return result;
            }
            catch (Exception ex)
            {
                _unitOfWork.Rollback();
                _logger.LogError(ex, "Error deleting category mapping ID: {MappingId}", mappingId);
                throw;
            }
        }

        /// <summary>
        /// Resolves conflicts for a specific category using configured master source
        /// </summary>
        public async Task<bool> ResolveConflictAsync(long crmCategoryId, CancellationToken ct = default)
        {
            try
            {
                var masterSource = _configuration.GetValue<string>("Dynamics365Sync:MasterSource") ?? "CRM";

                _logger.LogInformation("Resolving conflict for CRM Category {CategoryId} with master source: {MasterSource}",
                    crmCategoryId, masterSource);

                // TODO: Implement conflict resolution logic
                // 1. Get category from both systems
                // 2. Compare timestamps
                // 3. Apply master source rule
                // 4. Update the non-master system

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error resolving conflict for CRM Category ID: {CategoryId}", crmCategoryId);
                throw;
            }
        }

        /// <summary>
        /// Calculates next scheduled sync time based on CRON expression
        /// </summary>
        private DateTime? CalculateNextScheduledSync(string cronExpression, DateTime lastSync)
        {
            try
            {
                // Simple calculation for common patterns
                // "0 */6 * * *" = every 6 hours
                // "0 0 * * *" = daily at midnight
                // For more complex CRON parsing, consider using Cronos library

                if (cronExpression.Contains("*/6"))
                {
                    return lastSync.AddHours(6);
                }
                else if (cronExpression.Contains("*/1"))
                {
                    return lastSync.AddHours(1);
                }
                else if (cronExpression.StartsWith("0 0"))
                {
                    return lastSync.AddDays(1);
                }

                // Default to 6 hours
                return lastSync.AddHours(6);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Error calculating next scheduled sync from CRON expression: {CronExpression}", cronExpression);
                return null;
            }
        }

        /// <summary>
        /// Handles retry logic for failed sync operations
        /// </summary>
        private async Task<bool> HandleRetryAsync(Dynamics365CategorySync syncRecord, Exception ex, CancellationToken ct = default)
        {
            try
            {
                syncRecord.RetryCount++;
                syncRecord.ErrorMessage = ex.Message;
                syncRecord.UpdatedOn = DateTime.UtcNow;

                if (syncRecord.RetryCount < MAX_RETRY_COUNT)
                {
                    // Calculate exponential backoff
                    var delayMinutes = RETRY_DELAY_MINUTES * Math.Pow(2, syncRecord.RetryCount - 1);
                    syncRecord.NextRetryOn = DateTime.UtcNow.AddMinutes(delayMinutes);
                    syncRecord.SyncStatus = "PendingRetry";

                    await _syncRepository.UpdateAsync(syncRecord, ct);

                    _logger.LogWarning("Sync failed for category {CategoryId}. Retry {RetryCount}/{MaxRetries} scheduled for {NextRetry}",
                        syncRecord.CRMCategoryId, syncRecord.RetryCount, MAX_RETRY_COUNT, syncRecord.NextRetryOn);

                    return true;
                }
                else
                {
                    syncRecord.SyncStatus = SYNC_STATUS_FAILED;
                    syncRecord.NextRetryOn = null;

                    await _syncRepository.UpdateAsync(syncRecord, ct);

                    _logger.LogError("Sync failed for category {CategoryId} after {MaxRetries} retries",
                        syncRecord.CRMCategoryId, MAX_RETRY_COUNT);

                    return false;
                }
            }
            catch (Exception retryEx)
            {
                _logger.LogError(retryEx, "Error handling retry for category {CategoryId}", syncRecord.CRMCategoryId);
                return false;
            }
        }
    }
}
