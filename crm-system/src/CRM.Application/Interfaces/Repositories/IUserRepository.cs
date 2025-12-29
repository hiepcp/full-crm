using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for User entity operations
    /// </summary>
    public interface IUserRepository
    {
        /// <summary>
        /// Query users with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<User>> QueryAsync(UserQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get user by ID
        /// </summary>
        Task<User?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new user
        /// </summary>
        Task<long> CreateAsync(User user, CancellationToken ct = default);

        /// <summary>
        /// Update existing user
        /// </summary>
        Task<bool> UpdateAsync(User user, CancellationToken ct = default);

        /// <summary>
        /// Delete user by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if user exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get user by email
        /// </summary>
        Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);

        /// <summary>
        /// Get users by role
        /// </summary>
        Task<IEnumerable<User>> GetByRoleAsync(string role, CancellationToken ct = default);

        /// <summary>
        /// Get active users
        /// </summary>
        Task<IEnumerable<User>> GetActiveUsersAsync(CancellationToken ct = default);
    }
}
