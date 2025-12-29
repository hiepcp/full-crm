using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Contact entity operations
    /// </summary>
    public interface IContactRepository
    {
        /// <summary>
        /// Query contacts with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<Contact>> QueryAsync(ContactQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get contact by ID
        /// </summary>
        Task<Contact?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new contact
        /// </summary>
        Task<long> CreateAsync(Contact contact, CancellationToken ct = default);

        /// <summary>
        /// Update existing contact
        /// </summary>
        Task<bool> UpdateAsync(Contact contact, CancellationToken ct = default);

        /// <summary>
        /// Delete contact by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if contact exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get contacts by customer ID
        /// </summary>
        Task<IEnumerable<Contact>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Set contact as primary for its customer
        /// </summary>
        Task<bool> SetAsPrimaryAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Unset primary flag for all contacts of a customer
        /// </summary>
        Task<int> UnsetPrimaryAsync(long? customerId, CancellationToken ct = default);

        /// <summary>
        /// Get primary contact by customer ID
        /// </summary>
        Task<Contact?> GetPrimaryByCustomerIdAsync(long customerId, CancellationToken ct = default);

        /// <summary>
        /// Get contact by email
        /// </summary>
        Task<Contact?> GetByEmailAsync(string email, CancellationToken ct = default);

        /// <summary>
        /// Get deals by contact ID
        /// </summary>
        Task<IEnumerable<Deal>> GetDealsByContactAsync(long contactId, CancellationToken ct = default);

        /// <summary>
        /// Get activities by contact ID
        /// </summary>
        Task<IEnumerable<Activity>> GetActivitiesByContactAsync(long contactId, CancellationToken ct = default);

        /// <summary>
        /// Check uniqueness of email (excluding specific ID)
        /// </summary>
        Task<bool> IsEmailUniqueAsync(string email, long? excludeId = null, CancellationToken ct = default);
    }
}
