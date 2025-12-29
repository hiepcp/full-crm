using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Deal entity operations
    /// </summary>
    public interface IDealRepository
    {
        /// <summary>
        /// Query deals with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<Deal>> QueryAsync(DealQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get deal by ID
        /// </summary>
        Task<Deal?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new deal
        /// </summary>
        Task<long> CreateAsync(Deal deal, CancellationToken ct = default);

        /// <summary>
        /// Update existing deal
        /// </summary>
        Task<bool> UpdateAsync(Deal deal, CancellationToken ct = default);

        /// <summary>
        /// Delete deal by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if deal exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get deals by owner ID
        /// </summary>
        Task<IEnumerable<Deal>> GetByOwnerIdAsync(long ownerId, CancellationToken ct = default);

        /// <summary>
        /// Get deals by stage
        /// </summary>
        Task<IEnumerable<Deal>> GetByStageAsync(string stage, CancellationToken ct = default);

        /// <summary>
        /// Get deals with follow-up due on specific date
        /// </summary>
        Task<IEnumerable<Deal>> GetDealsWithFollowUpDueAsync(DateTime date, CancellationToken ct = default);
    }
}
