using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using static Dapper.SqlBuilder;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// User repository implementation using Dapper
    /// </summary>
    public class UserRepository : DapperRepository<User, long>, IUserRepository
    {
        public UserRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query users with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<User>> QueryAsync(UserQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_user /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_user /**where**/
            ");

            // Build WHERE clause
            BuildWhereClause(sqlBuilder, query);

            // Build ORDER BY clause
            if (!string.IsNullOrEmpty(query.OrderBy))
            {
                var orderBy = ParseOrderBy(query.OrderBy);
                sqlBuilder.OrderBy(orderBy);
            }
            else
            {
                sqlBuilder.OrderBy("UpdatedOn DESC");
            }

            // Execute queries
            var connection = Connection;
            var transaction = Transaction;

            using var multi = await connection.QueryMultipleAsync(
                $"{selector.RawSql}; {countSelector.RawSql}",
                selector.Parameters,
                transaction);

            var items = await multi.ReadAsync<User>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<User>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        public new async Task<User?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_user WHERE Id = @Id";

            var user = await Connection.QuerySingleOrDefaultAsync<User>(
                sql, new { Id = id }, Transaction);

            return user;
        }

        /// <summary>
        /// Create new user
        /// </summary>
        public async Task<long> CreateAsync(User user, CancellationToken ct = default)
        {
            return await base.AddAsync(user, ct);
        }

        /// <summary>
        /// Update existing user
        /// </summary>
        public new async Task<bool> UpdateAsync(User user, CancellationToken ct = default)
        {
            await base.UpdateAsync(user, ct);
            return true;
        }

        /// <summary>
        /// Delete user by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if user exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var user = await GetByIdAsync(id, ct);
            return user != null;
        }

        /// <summary>
        /// Get user by email
        /// </summary>
        public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        {
            return await Connection.QuerySingleOrDefaultAsync<User>(
                "SELECT * FROM crm_user WHERE Email = @Email",
                new { Email = email },
                Transaction);
        }

        /// <summary>
        /// Get users by role
        /// </summary>
        public async Task<IEnumerable<User>> GetByRoleAsync(string role, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<User>(
                "SELECT * FROM crm_user WHERE Role = @Role ORDER BY UpdatedOn DESC",
                new { Role = role },
                Transaction);
        }

        /// <summary>
        /// Get active users
        /// </summary>
        public async Task<IEnumerable<User>> GetActiveUsersAsync(CancellationToken ct = default)
        {
            return await Connection.QueryAsync<User>(
                "SELECT * FROM crm_user WHERE IsActive = 1 ORDER BY UpdatedOn DESC",
                transaction: Transaction);
        }

        /// <summary>
        /// Build WHERE clause from query parameters
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, UserQueryRequest query)
        {
            if (!string.IsNullOrEmpty(query.Email))
                sqlBuilder.Where("Email LIKE @Email", new { Email = $"%{query.Email}%" });

            if (!string.IsNullOrEmpty(query.FirstName))
                sqlBuilder.Where("FirstName LIKE @FirstName", new { FirstName = $"%{query.FirstName}%" });

            if (!string.IsNullOrEmpty(query.LastName))
                sqlBuilder.Where("LastName LIKE @LastName", new { LastName = $"%{query.LastName}%" });

            if (!string.IsNullOrEmpty(query.Role))
                sqlBuilder.Where("Role = @Role", new { Role = query.Role });

            if (query.IsActive.HasValue)
                sqlBuilder.Where("IsActive = @IsActive", new { IsActive = query.IsActive.Value });
        }

        /// <summary>
        /// Parse order by string to SQL-safe format
        /// </summary>
        private string ParseOrderBy(string orderBy)
        {
            // White-list allowed fields
            var allowedFields = new HashSet<string>
            { 
            "id", 
            "email", 
            "firstName", 
            "lastName", 
            "role", 
            "avatar", 
            "isActive", 
            "createdOn", 
            "updatedOn", 
            "createdBy", 
            "updatedBy" 
            };

            var parts = orderBy.Split(',');
            var orderClauses = new List<string>();

            foreach (var part in parts)
            {
                var trimmed = part.Trim();
                if (string.IsNullOrEmpty(trimmed)) continue;

                var isDescending = trimmed.StartsWith('-');
                var field = isDescending ? trimmed[1..] : trimmed;

                // Validate field name
                if (allowedFields.Contains(field.ToLower()))
                {
                    // Map to actual database column names
                    var dbField = field.ToLower() switch
                    {
                        "id" => "Id",
                        "email" => "Email",
                        "firstName" => "FirstName",
                        "lastName" => "LastName",
                        "role" => "Role",
                        "avatar" => "Avatar",
                        "isActive" => "IsActive",
                        "createdOn" => "CreatedOn",
                        "updatedOn" => "UpdatedOn",
                        "createdBy" => "CreatedBy",
                        "updatedBy" => "UpdatedBy",
                        _ => null
                    };

                    if (dbField != null)
                    {
                        orderClauses.Add($"{dbField} {(isDescending ? "DESC" : "ASC")}");
                    }
                }
            }

            return string.Join(", ", orderClauses);
        }
    }
}
