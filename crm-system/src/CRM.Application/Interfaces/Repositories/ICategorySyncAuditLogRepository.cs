using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for CategorySyncAuditLog entity operations
    /// </summary>
    public interface ICategorySyncAuditLogRepository
    {
        /// <summary>
        /// Get audit log by ID
        /// </summary>
        Task<CategorySyncAuditLog?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get all audit logs ordered by sync start date (descending)
        /// </summary>
        Task<IEnumerable<CategorySyncAuditLog>> GetAllAsync(CancellationToken ct = default);

        /// <summary>
        /// Get audit logs by sync status
        /// </summary>
        Task<IEnumerable<CategorySyncAuditLog>> GetBySyncStatusAsync(string syncStatus, CancellationToken ct = default);

        /// <summary>
        /// Get audit logs by sync direction (CRMToD365, D365ToCRM, Bidirectional)
        /// </summary>
        Task<IEnumerable<CategorySyncAuditLog>> GetBySyncDirectionAsync(string syncDirection, CancellationToken ct = default);

        /// <summary>
        /// Get audit logs by trigger source (Manual, Scheduled)
        /// </summary>
        Task<IEnumerable<CategorySyncAuditLog>> GetByTriggerSourceAsync(string triggerSource, CancellationToken ct = default);

        /// <summary>
        /// Get audit logs within a date range
        /// </summary>
        Task<IEnumerable<CategorySyncAuditLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken ct = default);

        /// <summary>
        /// Get the most recent audit log
        /// </summary>
        Task<CategorySyncAuditLog?> GetMostRecentAsync(CancellationToken ct = default);

        /// <summary>
        /// Get paginated audit logs
        /// </summary>
        Task<IEnumerable<CategorySyncAuditLog>> GetPaginatedAsync(int page, int pageSize, CancellationToken ct = default);

        /// <summary>
        /// Get total count of audit logs
        /// </summary>
        Task<int> GetTotalCountAsync(CancellationToken ct = default);

        /// <summary>
        /// Create new audit log record
        /// </summary>
        Task<long> CreateAsync(CategorySyncAuditLog auditLog, CancellationToken ct = default);

        /// <summary>
        /// Update existing audit log record
        /// </summary>
        Task<bool> UpdateAsync(CategorySyncAuditLog auditLog, CancellationToken ct = default);

        /// <summary>
        /// Delete audit log by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Delete old audit logs older than specified date
        /// </summary>
        Task<int> DeleteOldLogsAsync(DateTime olderThan, CancellationToken ct = default);
    }
}
