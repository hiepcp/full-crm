using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Quotation entity operations
    /// </summary>
    public interface IQuotationRepository
    {
        /// <summary>
        /// Query quotations with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<Quotation>> QueryAsync(QuotationQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get quotation by ID
        /// </summary>
        Task<Quotation?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new quotation
        /// </summary>
        Task<long> CreateAsync(Quotation quotation, CancellationToken ct = default);

        /// <summary>
        /// Update existing quotation
        /// </summary>
        Task<bool> UpdateAsync(Quotation quotation, CancellationToken ct = default);

        /// <summary>
        /// Delete quotation by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if quotation exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get quotations by status
        /// </summary>
        Task<IEnumerable<Quotation>> GetByStatusAsync(string status, CancellationToken ct = default);

        /// <summary>
        /// Get quotations by quotation number
        /// </summary>
        Task<Quotation?> GetByQuotationNumberAsync(string quotationNumber, CancellationToken ct = default);

        /// <summary>
        /// Get quotations by customer ID
        /// </summary>
        Task<IEnumerable<Quotation>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default);
    }
}
