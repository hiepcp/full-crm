using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Email entity operations
    /// </summary>
    public interface IEmailRepository
    {
        /// <summary>
        /// Query emails with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<Email>> QueryAsync(EmailQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get email by ID
        /// </summary>
        Task<Email?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new email
        /// </summary>
        Task<long> CreateAsync(Email email, CancellationToken ct = default);

        /// <summary>
        /// Update existing email
        /// </summary>
        Task<bool> UpdateAsync(Email email, CancellationToken ct = default);

        /// <summary>
        /// Delete email by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if email exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get emails by conversation ID
        /// </summary>
        Task<IEnumerable<Email>> GetByConversationIdAsync(string conversationId, CancellationToken ct = default);

        /// <summary>
        /// Get emails by sender address
        /// </summary>
        Task<IEnumerable<Email>> GetBySenderAsync(string senderAddress, CancellationToken ct = default);

        /// <summary>
        /// Get unread emails
        /// </summary>
        Task<IEnumerable<Email>> GetUnreadEmailsAsync(CancellationToken ct = default);
    }
}
