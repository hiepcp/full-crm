using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service interface for synchronizing categories between CRM and Dynamics 365
    /// </summary>
    public interface IDynamics365CategorySyncService
    {
        /// <summary>
        /// Executes bidirectional category synchronization between CRM and Dynamics 365
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Audit log ID of the sync operation</returns>
        Task<long> SyncCategoriesAsync(CancellationToken ct = default);

        /// <summary>
        /// Synchronizes categories from CRM to Dynamics 365
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Number of categories synchronized</returns>
        Task<int> SyncCategoriesToD365Async(CancellationToken ct = default);

        /// <summary>
        /// Synchronizes categories from Dynamics 365 to CRM
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Number of categories synchronized</returns>
        Task<int> SyncCategoriesFromD365Async(CancellationToken ct = default);

        /// <summary>
        /// Gets the status of the last sync operation
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Status information including last sync time, status, and next scheduled sync</returns>
        Task<SyncStatusDto> GetSyncStatusAsync(CancellationToken ct = default);

        /// <summary>
        /// Gets the most recent sync audit log entry
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Most recent audit log entry or null if no sync has run</returns>
        Task<CategorySyncAuditLog?> GetMostRecentSyncAsync(CancellationToken ct = default);

        /// <summary>
        /// Gets paginated audit log entries
        /// </summary>
        /// <param name="page">Page number (1-based)</param>
        /// <param name="pageSize">Number of items per page</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated audit log entries</returns>
        Task<PaginatedResult<CategorySyncAuditLog>> GetAuditLogAsync(int page, int pageSize, CancellationToken ct = default);

        /// <summary>
        /// Triggers manual sync operation
        /// </summary>
        /// <param name="triggeredBy">Email or identifier of the user triggering the sync</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Sync operation ID</returns>
        Task<long> TriggerManualSyncAsync(string triggeredBy, CancellationToken ct = default);

        /// <summary>
        /// Validates sync configuration and D365 connectivity
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>True if configuration is valid and D365 is reachable</returns>
        Task<bool> ValidateConfigurationAsync(CancellationToken ct = default);

        /// <summary>
        /// Gets all category mappings
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of category mappings</returns>
        Task<IEnumerable<CategoryMapping>> GetCategoryMappingsAsync(CancellationToken ct = default);

        /// <summary>
        /// Creates or updates a category mapping
        /// </summary>
        /// <param name="mapping">Category mapping to save</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Saved mapping ID</returns>
        Task<long> SaveCategoryMappingAsync(CategoryMapping mapping, CancellationToken ct = default);

        /// <summary>
        /// Deletes a category mapping
        /// </summary>
        /// <param name="mappingId">ID of the mapping to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>True if deleted successfully</returns>
        Task<bool> DeleteCategoryMappingAsync(long mappingId, CancellationToken ct = default);

        /// <summary>
        /// Resolves conflicts for a specific category using configured master source
        /// </summary>
        /// <param name="crmCategoryId">CRM category ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>True if conflict resolved successfully</returns>
        Task<bool> ResolveConflictAsync(long crmCategoryId, CancellationToken ct = default);
    }

    /// <summary>
    /// DTO for sync status information
    /// </summary>
    public class SyncStatusDto
    {
        public DateTime? LastSyncTime { get; set; }
        public string? SyncStatus { get; set; }
        public DateTime? NextScheduledSync { get; set; }
        public bool IsRunning { get; set; }
        public string? LastSyncError { get; set; }
        public int? LastSyncCategoriesCreated { get; set; }
        public int? LastSyncCategoriesUpdated { get; set; }
        public int? LastSyncConflictsResolved { get; set; }
    }

    /// <summary>
    /// Generic paginated result wrapper
    /// </summary>
    public class PaginatedResult<T>
    {
        public IEnumerable<T> Items { get; set; } = new List<T>();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => PageSize > 0 ? (int)Math.Ceiling((double)TotalCount / PageSize) : 0;
    }
}
