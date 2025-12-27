using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Dynamics365CategorySync entity operations
    /// </summary>
    public interface IDynamics365CategorySyncRepository
    {
        /// <summary>
        /// Get sync record by ID
        /// </summary>
        Task<Dynamics365CategorySync?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get sync record by CRM Category ID
        /// </summary>
        Task<Dynamics365CategorySync?> GetByCRMCategoryIdAsync(long crmCategoryId, CancellationToken ct = default);

        /// <summary>
        /// Get sync record by Dynamics 365 Category ID
        /// </summary>
        Task<Dynamics365CategorySync?> GetByDynamics365CategoryIdAsync(string dynamics365CategoryId, CancellationToken ct = default);

        /// <summary>
        /// Get all sync records with a specific sync status
        /// </summary>
        Task<IEnumerable<Dynamics365CategorySync>> GetBySyncStatusAsync(string syncStatus, CancellationToken ct = default);

        /// <summary>
        /// Get sync records that need retry (retry count > 0 and NextRetryOn <= now)
        /// </summary>
        Task<IEnumerable<Dynamics365CategorySync>> GetPendingRetriesAsync(CancellationToken ct = default);

        /// <summary>
        /// Get all sync records
        /// </summary>
        Task<IEnumerable<Dynamics365CategorySync>> GetAllAsync(CancellationToken ct = default);

        /// <summary>
        /// Create new sync record
        /// </summary>
        Task<long> CreateAsync(Dynamics365CategorySync syncRecord, CancellationToken ct = default);

        /// <summary>
        /// Update existing sync record
        /// </summary>
        Task<bool> UpdateAsync(Dynamics365CategorySync syncRecord, CancellationToken ct = default);

        /// <summary>
        /// Delete sync record by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if sync record exists for a CRM Category
        /// </summary>
        Task<bool> ExistsByCRMCategoryIdAsync(long crmCategoryId, CancellationToken ct = default);

        /// <summary>
        /// Check if sync record exists for a Dynamics 365 Category
        /// </summary>
        Task<bool> ExistsByDynamics365CategoryIdAsync(string dynamics365CategoryId, CancellationToken ct = default);
    }
}
