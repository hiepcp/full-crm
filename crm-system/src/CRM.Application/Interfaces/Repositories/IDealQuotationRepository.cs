using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for DealQuotation entity operations
    /// </summary>
    public interface IDealQuotationRepository
    {
        /// <summary>
        /// Query deal quotations with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<DealQuotation>> QueryAsync(DealQuotationQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Create new deal quotation link
        /// </summary>
        Task<long> CreateAsync(DealQuotation dealQuotation, CancellationToken ct = default);

        /// <summary>
        /// Bulk insert multiple deal quotations
        /// </summary>
        Task BulkInsertAsync(IEnumerable<DealQuotation> dealQuotations, CancellationToken ct = default);

        /// <summary>
        /// Get quotations by deal ID
        /// </summary>
        Task<IEnumerable<DealQuotation>> GetByDealIdAsync(long dealId, CancellationToken ct = default);

        /// <summary>
        /// Get deals by quotation number
        /// </summary>
        Task<IEnumerable<DealQuotation>> GetByQuotationNumberAsync(string quotationNumber, CancellationToken ct = default);

        /// <summary>
        /// Delete deal quotation link by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Delete all quotations for a deal
        /// </summary>
        Task<int> DeleteByDealIdAsync(long dealId, CancellationToken ct = default);
    }
}
