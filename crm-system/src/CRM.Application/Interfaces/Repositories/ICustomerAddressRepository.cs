using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for CustomerAddress entity operations
    /// </summary>
    public interface ICustomerAddressRepository
    {
        /// <summary>
        /// Query customer addresses with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<CustomerAddress>> QueryAsync(CustomerAddressQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get customer address by ID
        /// </summary>
        Task<CustomerAddress?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get all addresses for a specific customer
        /// </summary>
        Task<IEnumerable<CustomerAddress>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Get primary address for a specific customer and address type
        /// </summary>
        Task<CustomerAddress?> GetPrimaryAddressAsync(long customerId, string? addressType = null, CancellationToken ct = default);

        /// <summary>
        /// Create new customer address
        /// </summary>
        Task<long> CreateAsync(CustomerAddress address, CancellationToken ct = default);

        /// <summary>
        /// Update existing customer address
        /// </summary>
        Task<bool> UpdateAsync(CustomerAddress address, CancellationToken ct = default);

        /// <summary>
        /// Delete customer address by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if customer address exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Bulk insert addresses
        /// </summary>
        Task BulkInsertAsync(IEnumerable<CustomerAddress> addresses, CancellationToken ct = default);

        /// <summary>
        /// Delete all addresses for a customer
        /// </summary>
        Task<int> DeleteByCustomerIdAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Count addresses for a customer
        /// </summary>
        Task<int> CountByCustomerIdAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Set address as primary (and unset other primary addresses of same type)
        /// </summary>
        Task<bool> SetAsPrimaryAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Unset primary flag for all addresses of a customer and type
        /// </summary>
        Task<int> UnsetPrimaryAsync(long customerId, string addressType, CancellationToken ct = default);
    }
}


