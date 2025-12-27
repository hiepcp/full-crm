using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Dynamics365CategorySync repository implementation using Dapper
    /// </summary>
    public class Dynamics365CategorySyncRepository : DapperRepository<Dynamics365CategorySync, long>, IDynamics365CategorySyncRepository
    {
        public Dynamics365CategorySyncRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Get sync record by ID
        /// </summary>
        public new async Task<Dynamics365CategorySync?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_dynamics365_category_sync WHERE Id = @Id";

            var syncRecord = await Connection.QuerySingleOrDefaultAsync<Dynamics365CategorySync>(
                sql, new { Id = id }, Transaction);

            return syncRecord;
        }

        /// <summary>
        /// Get sync record by CRM Category ID
        /// </summary>
        public async Task<Dynamics365CategorySync?> GetByCRMCategoryIdAsync(long crmCategoryId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_dynamics365_category_sync WHERE CRMCategoryId = @CRMCategoryId";

            var syncRecord = await Connection.QuerySingleOrDefaultAsync<Dynamics365CategorySync>(
                sql, new { CRMCategoryId = crmCategoryId }, Transaction);

            return syncRecord;
        }

        /// <summary>
        /// Get sync record by Dynamics 365 Category ID
        /// </summary>
        public async Task<Dynamics365CategorySync?> GetByDynamics365CategoryIdAsync(string dynamics365CategoryId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_dynamics365_category_sync WHERE Dynamics365CategoryId = @Dynamics365CategoryId";

            var syncRecord = await Connection.QuerySingleOrDefaultAsync<Dynamics365CategorySync>(
                sql, new { Dynamics365CategoryId = dynamics365CategoryId }, Transaction);

            return syncRecord;
        }

        /// <summary>
        /// Get all sync records with a specific sync status
        /// </summary>
        public async Task<IEnumerable<Dynamics365CategorySync>> GetBySyncStatusAsync(string syncStatus, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_dynamics365_category_sync WHERE SyncStatus = @SyncStatus ORDER BY UpdatedOn DESC";

            return await Connection.QueryAsync<Dynamics365CategorySync>(
                sql, new { SyncStatus = syncStatus }, Transaction);
        }

        /// <summary>
        /// Get sync records that need retry (retry count > 0 and NextRetryOn <= now)
        /// </summary>
        public async Task<IEnumerable<Dynamics365CategorySync>> GetPendingRetriesAsync(CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM CRM_dynamics365_category_sync
                WHERE RetryCount > 0
                AND NextRetryOn IS NOT NULL
                AND NextRetryOn <= @Now
                ORDER BY NextRetryOn ASC";

            return await Connection.QueryAsync<Dynamics365CategorySync>(
                sql, new { Now = DateTime.UtcNow }, Transaction);
        }

        /// <summary>
        /// Get all sync records
        /// </summary>
        public async Task<IEnumerable<Dynamics365CategorySync>> GetAllAsync(CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_dynamics365_category_sync ORDER BY UpdatedOn DESC";

            return await Connection.QueryAsync<Dynamics365CategorySync>(sql, null, Transaction);
        }

        /// <summary>
        /// Create new sync record
        /// </summary>
        public async Task<long> CreateAsync(Dynamics365CategorySync syncRecord, CancellationToken ct = default)
        {
            return await base.AddAsync(syncRecord, ct);
        }

        /// <summary>
        /// Update existing sync record
        /// </summary>
        public new async Task<bool> UpdateAsync(Dynamics365CategorySync syncRecord, CancellationToken ct = default)
        {
            await base.UpdateAsync(syncRecord, ct);
            return true;
        }

        /// <summary>
        /// Delete sync record by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if sync record exists for a CRM Category
        /// </summary>
        public async Task<bool> ExistsByCRMCategoryIdAsync(long crmCategoryId, CancellationToken ct = default)
        {
            var syncRecord = await GetByCRMCategoryIdAsync(crmCategoryId, ct);
            return syncRecord != null;
        }

        /// <summary>
        /// Check if sync record exists for a Dynamics 365 Category
        /// </summary>
        public async Task<bool> ExistsByDynamics365CategoryIdAsync(string dynamics365CategoryId, CancellationToken ct = default)
        {
            var syncRecord = await GetByDynamics365CategoryIdAsync(dynamics365CategoryId, ct);
            return syncRecord != null;
        }
    }
}
