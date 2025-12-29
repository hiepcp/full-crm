using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service interface for Assignee business logic operations
    /// </summary>
    public interface IAssigneeService
    {
        /// <summary>
        /// Query assignees with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<AssigneeResponse>> QueryAsync(AssigneeQueryRequest request, CancellationToken ct = default);

        /// <summary>
        /// Get assignee by ID
        /// </summary>
        Task<AssigneeResponse?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get assignees by relation (e.g., all assignees for a specific lead)
        /// </summary>
        Task<IEnumerable<AssigneeResponse>> GetByRelationAsync(string relationType, long relationId, CancellationToken ct = default);

        /// <summary>
        /// Create new assignee
        /// </summary>
        Task<long> CreateAsync(CreateAssigneeRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Update existing assignee
        /// </summary>
        Task<bool> UpdateAsync(long id, UpdateAssigneeRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Delete assignee by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Check if user is assigned to a specific relation
        /// </summary>
        Task<bool> IsUserAssignedAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default);

        /// <summary>
        /// Get user's role for a specific relation
        /// </summary>
        Task<string?> GetUserRoleAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default);

        /// <summary>
        /// Remove all assignees from a relation (useful when deleting entities)
        /// </summary>
        Task<int> RemoveAllFromRelationAsync(string relationType, long relationId, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Transfer ownership from one user to another for a specific relation
        /// </summary>
        Task<bool> TransferOwnershipAsync(string relationType, long relationId, string fromUserEmail, string toUserEmail, string performedByEmail, CancellationToken ct = default);
    }
}













