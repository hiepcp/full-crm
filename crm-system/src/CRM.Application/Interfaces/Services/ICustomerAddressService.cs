using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service interface for CustomerAddress business logic operations
    /// </summary>
    public interface ICustomerAddressService
    {
        /// <summary>
        /// Query customer addresses with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<CustomerAddressResponse>> QueryAsync(CustomerAddressQueryRequest request, CancellationToken ct = default);

        /// <summary>
        /// Get customer address by ID
        /// </summary>
        Task<CustomerAddressResponse?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get all addresses for a specific customer
        /// </summary>
        Task<IEnumerable<CustomerAddressResponse>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Get primary address for a specific customer and address type
        /// </summary>
        Task<CustomerAddressResponse?> GetPrimaryAddressAsync(long customerId, string? addressType = null, CancellationToken ct = default);

        /// <summary>
        /// Create new customer address
        /// </summary>
        Task<long> CreateAsync(CreateCustomerAddressRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Update existing customer address
        /// </summary>
        Task<bool> UpdateAsync(long id, UpdateCustomerAddressRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Delete customer address by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Set address as primary for its type
        /// </summary>
        Task<bool> SetAsPrimaryAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Bulk create addresses for a customer
        /// </summary>
        Task<int> BulkCreateAsync(long customerId, IEnumerable<CreateCustomerAddressRequest> requests, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Delete all addresses for a customer
        /// </summary>
        Task<int> DeleteByCustomerIdAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Count addresses for a customer
        /// </summary>
        Task<int> CountByCustomerIdAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Check if customer has primary address of specific type
        /// </summary>
        Task<bool> HasPrimaryAddressAsync(long customerId, string addressType, CancellationToken ct = default);

        /// <summary>
        /// Validate customer address data
        /// </summary>
        //Task<ValidationResult> ValidateAddressAsync(CreateCustomerAddressRequest request, CancellationToken ct = default);
    }
}
