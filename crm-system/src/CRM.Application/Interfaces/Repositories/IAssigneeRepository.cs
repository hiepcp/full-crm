using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Assignee entity operations
    /// </summary>
    public interface IAssigneeRepository
    {
        /// <summary>
        /// Query assignees with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<Assignee>> QueryAsync(AssigneeQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get assignee by ID
        /// </summary>
        Task<Assignee?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get assignees by relation (e.g., all assignees for a specific lead)
        /// </summary>
        Task<IEnumerable<Assignee>> GetByRelationAsync(string relationType, long relationId, CancellationToken ct = default);

        /// <summary>
        /// Create new assignee
        /// </summary>
        Task<long> CreateAsync(Assignee assignee, CancellationToken ct = default);

        /// <summary>
        /// Update existing assignee
        /// </summary>
        Task<bool> UpdateAsync(Assignee assignee, CancellationToken ct = default);

        /// <summary>
        /// Delete assignee by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if assignee exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if user is assigned to a specific relation
        /// </summary>
        Task<bool> IsUserAssignedAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default);

        /// <summary>
        /// Get user's role for a specific relation
        /// </summary>
        Task<string?> GetUserRoleAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default);

        /// <summary>
        /// Remove all assignees from a relation
        /// </summary>
        Task<int> RemoveAllFromRelationAsync(string relationType, long relationId, CancellationToken ct = default);

        /// <summary>
        /// Get assignees by user email
        /// </summary>
        Task<IEnumerable<Assignee>> GetByUserEmailAsync(string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Check if assignment already exists (prevent duplicates)
        /// </summary>
        Task<bool> AssignmentExistsAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default);
    }
}













