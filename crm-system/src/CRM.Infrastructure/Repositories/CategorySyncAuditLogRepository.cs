using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// CategorySyncAuditLog repository implementation using Dapper
    /// </summary>
    public class CategorySyncAuditLogRepository : DapperRepository<CategorySyncAuditLog, long>, ICategorySyncAuditLogRepository
    {
        public CategorySyncAuditLogRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Get audit log by ID
        /// </summary>
        public new async Task<CategorySyncAuditLog?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_sync_audit_log WHERE Id = @Id";

            var auditLog = await Connection.QuerySingleOrDefaultAsync<CategorySyncAuditLog>(
                sql, new { Id = id }, Transaction);

            return auditLog;
        }

        /// <summary>
        /// Get all audit logs ordered by sync start date (descending)
        /// </summary>
        public async Task<IEnumerable<CategorySyncAuditLog>> GetAllAsync(CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_sync_audit_log ORDER BY SyncStartedOn DESC";

            return await Connection.QueryAsync<CategorySyncAuditLog>(sql, null, Transaction);
        }

        /// <summary>
        /// Get audit logs by sync status
        /// </summary>
        public async Task<IEnumerable<CategorySyncAuditLog>> GetBySyncStatusAsync(string syncStatus, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_sync_audit_log WHERE SyncStatus = @SyncStatus ORDER BY SyncStartedOn DESC";

            return await Connection.QueryAsync<CategorySyncAuditLog>(
                sql, new { SyncStatus = syncStatus }, Transaction);
        }

        /// <summary>
        /// Get audit logs by sync direction (CRMToD365, D365ToCRM, Bidirectional)
        /// </summary>
        public async Task<IEnumerable<CategorySyncAuditLog>> GetBySyncDirectionAsync(string syncDirection, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_sync_audit_log WHERE SyncDirection = @SyncDirection ORDER BY SyncStartedOn DESC";

            return await Connection.QueryAsync<CategorySyncAuditLog>(
                sql, new { SyncDirection = syncDirection }, Transaction);
        }

        /// <summary>
        /// Get audit logs by trigger source (Manual, Scheduled)
        /// </summary>
        public async Task<IEnumerable<CategorySyncAuditLog>> GetByTriggerSourceAsync(string triggerSource, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_sync_audit_log WHERE TriggerSource = @TriggerSource ORDER BY SyncStartedOn DESC";

            return await Connection.QueryAsync<CategorySyncAuditLog>(
                sql, new { TriggerSource = triggerSource }, Transaction);
        }

        /// <summary>
        /// Get audit logs within a date range
        /// </summary>
        public async Task<IEnumerable<CategorySyncAuditLog>> GetByDateRangeAsync(DateTime startDate, DateTime endDate, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM CRM_category_sync_audit_log
                WHERE SyncStartedOn >= @StartDate
                AND SyncStartedOn <= @EndDate
                ORDER BY SyncStartedOn DESC";

            return await Connection.QueryAsync<CategorySyncAuditLog>(
                sql, new { StartDate = startDate, EndDate = endDate }, Transaction);
        }

        /// <summary>
        /// Get the most recent audit log
        /// </summary>
        public async Task<CategorySyncAuditLog?> GetMostRecentAsync(CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_sync_audit_log ORDER BY SyncStartedOn DESC LIMIT 1";

            return await Connection.QuerySingleOrDefaultAsync<CategorySyncAuditLog>(sql, null, Transaction);
        }

        /// <summary>
        /// Get paginated audit logs
        /// </summary>
        public async Task<IEnumerable<CategorySyncAuditLog>> GetPaginatedAsync(int page, int pageSize, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM CRM_category_sync_audit_log
                ORDER BY SyncStartedOn DESC
                LIMIT @Limit OFFSET @Offset";

            var offset = (page - 1) * pageSize;

            return await Connection.QueryAsync<CategorySyncAuditLog>(
                sql, new { Limit = pageSize, Offset = offset }, Transaction);
        }

        /// <summary>
        /// Get total count of audit logs
        /// </summary>
        public async Task<int> GetTotalCountAsync(CancellationToken ct = default)
        {
            const string sql = "SELECT COUNT(*) FROM CRM_category_sync_audit_log";

            return await Connection.ExecuteScalarAsync<int>(sql, null, Transaction);
        }

        /// <summary>
        /// Create new audit log record
        /// </summary>
        public async Task<long> CreateAsync(CategorySyncAuditLog auditLog, CancellationToken ct = default)
        {
            return await base.AddAsync(auditLog, ct);
        }

        /// <summary>
        /// Update existing audit log record
        /// </summary>
        public new async Task<bool> UpdateAsync(CategorySyncAuditLog auditLog, CancellationToken ct = default)
        {
            await base.UpdateAsync(auditLog, ct);
            return true;
        }

        /// <summary>
        /// Delete audit log by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Delete old audit logs older than specified date
        /// </summary>
        public async Task<int> DeleteOldLogsAsync(DateTime olderThan, CancellationToken ct = default)
        {
            const string sql = "DELETE FROM CRM_category_sync_audit_log WHERE SyncStartedOn < @OlderThan";

            return await Connection.ExecuteAsync(sql, new { OlderThan = olderThan }, Transaction);
        }
    }
}
