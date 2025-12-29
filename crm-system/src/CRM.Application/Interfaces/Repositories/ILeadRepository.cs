using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Lead entity operations
    /// </summary>
    public interface ILeadRepository
    {
        /// <summary>
        /// Query leads with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<Lead>> QueryAsync(LeadQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get lead by ID
        /// </summary>
        Task<Lead?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new lead
        /// </summary>
        Task<long> CreateAsync(Lead lead, CancellationToken ct = default);

        /// <summary>
        /// Update existing lead
        /// </summary>
        Task<bool> UpdateAsync(Lead lead, CancellationToken ct = default);

        /// <summary>
        /// Delete lead by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if lead exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check uniqueness of email (excluding specific ID)
        /// </summary>
        Task<bool> IsEmailUniqueAsync(string email, long? excludeId = null, CancellationToken ct = default);

        /// <summary>
        /// Check uniqueness of website (excluding specific ID)
        /// </summary>
        Task<bool> IsWebsiteUniqueAsync(string website, long? excludeId = null, CancellationToken ct = default);

        /// <summary>
        /// Get leads by owner ID
        /// </summary>
        Task<IEnumerable<Lead>> GetByOwnerIdAsync(long ownerId, CancellationToken ct = default);

        /// <summary>
        /// Get leads by status
        /// </summary>
        Task<IEnumerable<Lead>> GetByStatusAsync(string status, CancellationToken ct = default);

        /// <summary>
        /// Get leads by source
        /// </summary>
        Task<IEnumerable<Lead>> GetBySourceAsync(string source, CancellationToken ct = default);

        /// <summary>
        /// Get qualified leads (score >= threshold)
        /// </summary>
        Task<IEnumerable<Lead>> GetQualifiedLeadsAsync(int minScore = 70, CancellationToken ct = default);

        /// <summary>
        /// Convert lead to customer/contact (business logic)
        /// </summary>
        Task<bool> ConvertLeadAsync(long leadId, long customerId, long? contactId = null, CancellationToken ct = default);

        /// <summary>
        /// Mark lead as duplicate
        /// </summary>
        Task<bool> MarkAsDuplicateAsync(long leadId, long duplicateOfLeadId, CancellationToken ct = default);

        /// <summary>
        /// Bulk update lead status
        /// </summary>
        Task<int> BulkUpdateStatusAsync(IEnumerable<long> leadIds, string newStatus, CancellationToken ct = default);

        /// <summary>
        /// Bulk assign leads to owner
        /// </summary>
        Task<int> BulkAssignAsync(IEnumerable<long> leadIds, long ownerId, CancellationToken ct = default);

        /// <summary>
        /// Get leads with follow-up due on specific date
        /// </summary>
        Task<IEnumerable<Lead>> GetLeadsWithFollowUpDueAsync(DateTime date, CancellationToken ct = default);
    }
}
