using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Activity entity operations
    /// </summary>
    public interface IActivityRepository
    {
        /// <summary>
        /// Query activities with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<Activity>> QueryAsync(ActivityQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get activity by ID
        /// </summary>
        Task<Activity?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new activity
        /// </summary>
        Task<long> CreateAsync(Activity activity, CancellationToken ct = default);

        /// <summary>
        /// Update existing activity
        /// </summary>
        Task<bool> UpdateAsync(Activity activity, CancellationToken ct = default);

        /// <summary>
        /// Delete activity by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if activity exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get activities by assigned user
        /// </summary>
        Task<IEnumerable<Activity>> GetByAssignedToAsync(string assignedTo, CancellationToken ct = default);

        /// <summary>
        /// Get activities by status
        /// </summary>
        Task<IEnumerable<Activity>> GetByStatusAsync(string status, CancellationToken ct = default);

        /// <summary>
        /// Get activities by type
        /// </summary>
        Task<IEnumerable<Activity>> GetByTypeAsync(string activityType, CancellationToken ct = default);
    }
}
