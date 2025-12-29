using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Assignee repository implementation using Dapper
    /// </summary>
    public class AssigneeRepository : DapperRepository<Assignee, long>, IAssigneeRepository
    {
        public AssigneeRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Get assignee by ID
        /// </summary>
        public new async Task<Assignee?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            return await base.GetByIdAsync(id, ct);
        }

        /// <summary>
        /// Create new assignee
        /// </summary>
        public async Task<long> CreateAsync(Assignee assignee, CancellationToken ct = default)
        {
            return await base.AddAsync(assignee, ct);
        }

        /// <summary>
        /// Update existing assignee
        /// </summary>
        public new async Task<bool> UpdateAsync(Assignee assignee, CancellationToken ct = default)
        {
            await base.UpdateAsync(assignee, ct);
            return true;
        }

        /// <summary>
        /// Delete assignee by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if assignee exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var assignee = await GetByIdAsync(id, ct);
            return assignee != null;
        }

        /// <summary>
        /// Query assignees with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<Assignee>> QueryAsync(AssigneeQueryRequest query, CancellationToken ct = default)
        {
            var sql = @"
                SELECT 
                a.Id as Id, a.UserEmail as UserEmail, a.RelationType as RelationType, a.RelationId as RelationId, a.Role as Role, a.AssignedAt as AssignedAt, a.Notes as Notes,
                u.Email as Email, u.FirstName as UserFirstName, u.LastName as UserLastName, u.Avatar as UserAvatar
                FROM crm_assignee a
                LEFT JOIN crm_user u ON a.UserEmail = u.Email
                WHERE 1=1";

            var countSql = @"SELECT COUNT(1) FROM crm_assignee a WHERE 1=1";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();
            var countWhereClauses = new List<string>();

            // Build WHERE clauses
            if (!string.IsNullOrEmpty(query.RelationType))
            {
                whereClauses.Add(" AND a.RelationType = @RelationType");
                countWhereClauses.Add(" AND a.RelationType = @RelationType");
                parameters.Add("RelationType", query.RelationType);
            }

            if (query.RelationId.HasValue)
            {
                whereClauses.Add(" AND a.RelationId = @RelationId");
                countWhereClauses.Add(" AND a.RelationId = @RelationId");
                parameters.Add("RelationId", query.RelationId.Value);
            }

            if (!string.IsNullOrEmpty(query.UserEmail))
            {
                whereClauses.Add(" AND a.UserEmail = @UserEmail");
                countWhereClauses.Add(" AND a.UserEmail = @UserEmail");
                parameters.Add("UserEmail", query.UserEmail);
            }

            if (!string.IsNullOrEmpty(query.Role))
            {
                whereClauses.Add(" AND a.Role = @Role");
                countWhereClauses.Add(" AND a.Role = @Role");
                parameters.Add("Role", query.Role);
            }

            // Add WHERE clauses to SQL
            sql += string.Join("", whereClauses);
            countSql += string.Join("", countWhereClauses);

            // Add ORDER BY
            var orderBy = ParseOrderBy(!string.IsNullOrEmpty(query.OrderBy) ? query.OrderBy : "-AssignedAt");
            sql += $" ORDER BY {orderBy}";

            // Add LIMIT/OFFSET for pagination
            sql += " LIMIT @PageSize OFFSET @Offset";
            parameters.Add("PageSize", query.PageSize);
            parameters.Add("Offset", (query.Page - 1) * query.PageSize);

            // Execute queries
            var connection = Connection;
            var transaction = Transaction;

            using var multi = await connection.QueryMultipleAsync(
                $"{sql}; {countSql}",
                parameters,
                transaction);

            var items = await multi.ReadAsync<Assignee>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Assignee>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Get assignees by relation (e.g., all assignees for a specific lead)
        /// </summary>
        public async Task<IEnumerable<Assignee>> GetByRelationAsync(string relationType, long relationId, CancellationToken ct = default)
        {
            var sql = @"
                SELECT 
                a.Id as Id, a.UserEmail as UserEmail, a.RelationType as RelationType, a.RelationId as RelationId, a.Role as Role, a.AssignedAt as AssignedAt, a.Notes as Notes,
                u.Id as UserId, u.Email as Email, u.FirstName as UserFirstName, u.LastName as UserLastName, u.Avatar as UserAvatar
                FROM crm_assignee a
                LEFT JOIN crm_user u ON a.UserEmail = u.Email
                WHERE a.RelationType = @RelationType AND a.RelationId = @RelationId
                ORDER BY a.AssignedAt DESC";

            return await Connection.QueryAsync<Assignee>(sql,
                new { RelationType = relationType, RelationId = relationId },
                Transaction);
        }

        /// <summary>
        /// Check if user is assigned to a specific relation
        /// </summary>
        public async Task<bool> IsUserAssignedAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default)
        {
            var sql = @"SELECT COUNT(1) FROM crm_assignee
                       WHERE UserEmail = @UserEmail AND RelationType = @RelationType AND RelationId = @RelationId";

            var count = await Connection.ExecuteScalarAsync<int>(sql,
                new { UserEmail = userEmail, RelationType = relationType, RelationId = relationId },
                Transaction);

            return count > 0;
        }

        /// <summary>
        /// Get user's role for a specific relation
        /// </summary>
        public async Task<string?> GetUserRoleAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default)
        {
            var sql = @"SELECT Role FROM crm_assignee
                       WHERE UserEmail = @UserEmail AND RelationType = @RelationType AND RelationId = @RelationId";

            return await Connection.QuerySingleOrDefaultAsync<string?>(sql,
                new { UserEmail = userEmail, RelationType = relationType, RelationId = relationId },
                Transaction);
        }

        /// <summary>
        /// Remove all assignees from a relation
        /// </summary>
        public async Task<int> RemoveAllFromRelationAsync(string relationType, long relationId, CancellationToken ct = default)
        {
            var sql = @"DELETE FROM crm_assignee WHERE RelationType = @RelationType AND RelationId = @RelationId";

            return await Connection.ExecuteAsync(sql,
                new { RelationType = relationType, RelationId = relationId },
                Transaction);
        }

        /// <summary>
        /// Get assignees by user email
        /// </summary>
        public async Task<IEnumerable<Assignee>> GetByUserEmailAsync(string userEmail, CancellationToken ct = default)
        {
            var sql = @"
                SELECT 
                a.Id as Id, a.UserEmail as UserEmail, a.RelationType as RelationType, a.RelationId as RelationId, a.Role as Role, a.AssignedAt as AssignedAt, a.Notes as Notes,
                u.Email as Email, u.FirstName as UserFirstName, u.LastName as UserLastName, u.Avatar as UserAvatar
                FROM crm_assignee a
                LEFT JOIN crm_user u ON a.UserEmail = u.Email
                WHERE a.UserEmail = @UserEmail
                ORDER BY a.AssignedAt DESC";

            return await Connection.QueryAsync<Assignee>(sql, new { UserEmail = userEmail }, Transaction);
        }

        /// <summary>
        /// Check if assignment already exists (prevent duplicates)
        /// </summary>
        public async Task<bool> AssignmentExistsAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default)
        {
            var sql = @"SELECT COUNT(1) FROM crm_assignee
                       WHERE UserEmail = @UserEmail AND RelationType = @RelationType AND RelationId = @RelationId";

            var count = await Connection.ExecuteScalarAsync<int>(sql,
                new { UserEmail = userEmail, RelationType = relationType, RelationId = relationId },
                Transaction);

            return count > 0;
        }

        /// <summary>
        /// Parse order by string to SQL-safe format
        /// </summary>
        private string ParseOrderBy(string orderBy)
        {
            // White-list allowed fields
            var allowedFields = new HashSet<string>
            {
                "id", "userEmail", "relationType", "relationId", "role", "assignedAt", "notes",
                "createdOn", "updatedOn"
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
                if (allowedFields.Contains(field, StringComparer.OrdinalIgnoreCase))
                {
                    // Map to actual database column names
                    var dbField = field.ToLower() switch
                    {
                        "id"            => "a.id",
                        "useremail"     => "a.userEmail",
                        "relationtype"  => "a.relationType",
                        "relationid"    => "a.relationId",
                        "role"          => "a.role",
                        "assignedat"    => "a.assignedAt",
                        "notes"         => "a.notes",
                        "createdon"     => "a.CreatedOn",
                        "updatedon"     => "a.UpdatedOn",
                        _ => null
                    };

                    if (dbField != null)
                    {
                        orderClauses.Add($"{dbField} {(isDescending ? "DESC" : "ASC")}");
                    }
                }
            }

            return orderClauses.Count > 0 ? string.Join(", ", orderClauses) : "a.assigned_at DESC";
        }
    }
}
