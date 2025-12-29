using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Customer entity operations
    /// </summary>
    public interface ICustomerRepository
    {
        /// <summary>
        /// Query customers with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<Customer>> QueryAsync(CustomerQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get customer by ID
        /// </summary>
        Task<Customer?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new customer
        /// </summary>
        Task<long> CreateAsync(Customer customer, CancellationToken ct = default);

        /// <summary>
        /// Create new customer with an explicit Id (for Dynamics CustAccount linkage)
        /// </summary>
        Task<long> CreateWithExplicitIdAsync(Customer customer, CancellationToken ct = default);

        /// <summary>
        /// Update existing customer
        /// </summary>
        Task<bool> UpdateAsync(Customer customer, CancellationToken ct = default);

        /// <summary>
        /// Delete customer by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if customer exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get customers by owner ID
        /// </summary>
        Task<IEnumerable<Customer>> GetByOwnerIdAsync(long ownerId, CancellationToken ct = default);

        /// <summary>
        /// Get customers by domain
        /// </summary>
        Task<IEnumerable<Customer>> GetByDomainAsync(string domain, CancellationToken ct = default);

        /// <summary>
        /// Get customers by email
        /// </summary>
        Task<IEnumerable<Customer>> GetByEmailAsync(string email, CancellationToken ct = default);

        /// <summary>
        /// Get customers by name
        /// </summary>
        Task<IEnumerable<Customer>> GetByNameAsync(string name, CancellationToken ct = default);

        /// <summary>
        /// Get customers by type
        /// </summary>
        Task<IEnumerable<Customer>> GetByTypeAsync(string type, CancellationToken ct = default);

        /// <summary>
        /// Get deals by customer ID
        /// </summary>
        Task<IEnumerable<Deal>> GetDealsByCustomerAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Get leads by customer ID
        /// </summary>
        Task<IEnumerable<Lead>> GetLeadsByCustomerAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Get contacts by customer ID
        /// </summary>
        Task<IEnumerable<Contact>> GetContactsByCustomerAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Get activities by customer ID
        /// </summary>
        Task<IEnumerable<Activity>> GetActivitiesByCustomerAsync(long customerId, CancellationToken ct = default);
    }
}
