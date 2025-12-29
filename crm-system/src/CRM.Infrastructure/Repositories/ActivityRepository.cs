using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using static Dapper.SqlBuilder;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;
using CRMSys.Application.Utils;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Activity repository implementation using Dapper
    /// </summary>
    public class ActivityRepository : DapperRepository<Activity, long>, IActivityRepository
    {
        public ActivityRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query activities with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<Activity>> QueryAsync(ActivityQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_activity /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_activity /**where**/
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
                sqlBuilder.OrderBy("CreatedOn DESC");
            }

            // Execute queries
            var connection = Connection;
            var transaction = Transaction;

            using var multi = await connection.QueryMultipleAsync(
                $"{selector.RawSql}; {countSelector.RawSql}",
                selector.Parameters,
                transaction);

            var items = await multi.ReadAsync<Activity>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Activity>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Get activity by ID
        /// </summary>
        public new async Task<Activity?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_activity WHERE Id = @Id";

            var activity = await Connection.QuerySingleOrDefaultAsync<Activity>(
                sql, new { Id = id }, Transaction);

            return activity;
        }

        /// <summary>
        /// Create new activity
        /// </summary>
        public async Task<long> CreateAsync(Activity activity, CancellationToken ct = default)
        {
            return await base.AddAsync(activity, ct);
        }

        /// <summary>
        /// Update existing activity
        /// </summary>
        public new async Task<bool> UpdateAsync(Activity activity, CancellationToken ct = default)
        {
            await base.UpdateAsync(activity, ct);
            return true;
        }

        /// <summary>
        /// Delete activity by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if activity exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var activity = await GetByIdAsync(id, ct);
            return activity != null;
        }

        /// <summary>
        /// Get activities by assigned user
        /// </summary>
        public async Task<IEnumerable<Activity>> GetByAssignedToAsync(string assignedTo, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Activity>(
                "SELECT * FROM crm_activity WHERE AssignedTo = @AssignedTo ORDER BY CreatedOn DESC",
                new { AssignedTo = assignedTo },
                Transaction);
        }

        /// <summary>
        /// Get activities by status
        /// </summary>
        public async Task<IEnumerable<Activity>> GetByStatusAsync(string status, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Activity>(
                "SELECT * FROM crm_activity WHERE Status = @Status ORDER BY CreatedOn DESC",
                new { Status = status },
                Transaction);
        }

        /// <summary>
        /// Get activities by type
        /// </summary>
        public async Task<IEnumerable<Activity>> GetByTypeAsync(string activityType, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Activity>(
                "SELECT * FROM crm_activity WHERE ActivityType = @ActivityType ORDER BY CreatedOn DESC",
                new { ActivityType = activityType },
                Transaction);
        }

        /// <summary>
        /// Build WHERE clause from query parameters using generic filter processing
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, ActivityQueryRequest query)
        {
            // Build all filter expressions (both simple and complex)
            var filterExpressions = FieldMapper.BuildAllFilterExpressions(query);

            foreach (var expr in filterExpressions)
            {
                var filterExpr = expr.Value;

                // For operators that don't need parameters (IS NULL, IS NOT NULL)
                if (filterExpr.ParameterValue == null &&
                    (filterExpr.Operator == "isnull" || filterExpr.Operator == "isnotnull"))
                {
                    sqlBuilder.Where(filterExpr.FilterString);
                }
                else
                {
                    // Create dynamic parameter object for all other filters
                    var parameters = new System.Dynamic.ExpandoObject() as IDictionary<string, object>;
                    parameters[filterExpr.ParameterName] = filterExpr.ParameterValue!;
                    sqlBuilder.Where(filterExpr.FilterString, parameters);
                }
            }
        }

        /// <summary>
        /// Parse order by string to SQL-safe format using FieldMapper
        /// </summary>
        private string ParseOrderBy(string orderBy)
        {
            // Use FieldMapper for activity columns (case-insensitive mapping)
            return FieldMapper.ParseOrderBy(orderBy);
        }
    }
}
