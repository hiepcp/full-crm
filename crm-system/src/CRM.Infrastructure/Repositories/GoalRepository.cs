using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Utils;
using CRMSys.Domain.Entities;
using Dapper;
using static Dapper.SqlBuilder;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    public class GoalRepository : DapperRepository<Goal, long>, IGoalRepository
    {
        public GoalRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        public async Task<PagedResult<Goal>> QueryAsync(GoalQueryRequest query, CancellationToken ct = default)
        {
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");

            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_goal /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_goal /**where**/
            ");

            BuildWhereClause(sqlBuilder, query);

            if (!string.IsNullOrEmpty(query.SortBy))
            {
                var orderBy = $"{query.SortBy} {(query.SortOrder == "asc" ? "ASC" : "DESC")}";
                sqlBuilder.OrderBy(orderBy);
            }
            else
            {
                sqlBuilder.OrderBy("UpdatedOn DESC");
            }

            using var multi = await Connection.QueryMultipleAsync(
                $"{selector.RawSql}; {countSelector.RawSql}",
                selector.Parameters,
                Transaction);

            var items = await multi.ReadAsync<Goal>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Goal>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        public new async Task<Goal?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_goal WHERE Id = @Id";
            return await Connection.QuerySingleOrDefaultAsync<Goal>(sql, new { Id = id }, Transaction);
        }

        public async Task<long> CreateAsync(Goal goal, CancellationToken ct = default)
        {
            return await base.AddAsync(goal, ct);
        }

        public new async Task<bool> UpdateAsync(Goal goal, CancellationToken ct = default)
        {
            await base.UpdateAsync(goal, ct);
            return true;
        }

        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        public async Task<IEnumerable<GoalMetricsResponse>> GetMetricsAsync(GoalMetricsRequest request, CancellationToken ct = default)
        {
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select(@"
                OwnerType,
                OwnerId,
                Timeframe,
                Type,
                COUNT(1) AS TotalGoals,
                COALESCE(SUM(TargetValue), 0) AS TotalTargetValue,
                COALESCE(SUM(Progress), 0) AS TotalProgress,
                COALESCE(AVG(Progress), 0) AS AverageProgress,
                0 AS CompletionRate
            ");

            BuildMetricsWhereClause(sqlBuilder, request);

            var orderBy = BuildMetricsOrderBy(request.SortBy, request.SortOrder);
            if (!string.IsNullOrEmpty(orderBy))
            {
                sqlBuilder.OrderBy(orderBy);
            }

            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_goal /**where**/
                GROUP BY OwnerType, OwnerId, Timeframe, Type
                /**orderby**/
            ");

            var parameters = new DynamicParameters(selector.Parameters);
            if (request.Top.HasValue)
            {
                parameters.Add("TopValue", request.Top.Value);
            }

            var sql = selector.RawSql;
            if (request.Top.HasValue)
            {
                sql += " LIMIT @TopValue";
            }

            return await Connection.QueryAsync<GoalMetricsResponse>(sql, parameters, Transaction);
        }

        // === New: Hierarchy Support ===

        /// <summary>
        /// Get direct children of a parent goal
        /// </summary>
        public async Task<IEnumerable<Goal>> GetChildrenAsync(long parentGoalId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_goal WHERE ParentGoalId = @ParentGoalId ORDER BY Name";
            return await Connection.QueryAsync<Goal>(sql, new { ParentGoalId = parentGoalId }, Transaction);
        }

        /// <summary>
        /// Get all descendants of a root goal using recursive CTE
        /// </summary>
        public async Task<IEnumerable<Goal>> GetDescendantsAsync(long rootGoalId, CancellationToken ct = default)
        {
            const string sql = @"
                WITH RECURSIVE goal_tree AS (
                    -- Base case: start with root goal
                    SELECT * FROM crm_goal WHERE Id = @RootGoalId

                    UNION ALL

                    -- Recursive case: get children
                    SELECT g.* FROM crm_goal g
                    INNER JOIN goal_tree gt ON g.ParentGoalId = gt.Id
                )
                SELECT * FROM goal_tree ORDER BY Name";

            return await Connection.QueryAsync<Goal>(sql, new { RootGoalId = rootGoalId }, Transaction);
        }

        /// <summary>
        /// Get all ancestors of a child goal (iteratively following parent chain)
        /// </summary>
        public async Task<IEnumerable<Goal>> GetAncestorsAsync(long childGoalId, CancellationToken ct = default)
        {
            var ancestors = new List<Goal>();
            var currentId = childGoalId;

            // Max 3 levels (company -> team -> individual)
            for (int i = 0; i < 3; i++)
            {
                const string sql = @"
                    SELECT parent.* FROM crm_goal child
                    INNER JOIN crm_goal parent ON child.ParentGoalId = parent.Id
                    WHERE child.Id = @CurrentId";

                var parent = await Connection.QuerySingleOrDefaultAsync<Goal>(sql, new { CurrentId = currentId }, Transaction);

                if (parent == null)
                    break;

                ancestors.Add(parent);
                currentId = parent.Id;
            }

            return ancestors;
        }

        // === New: Auto-Calculation Support ===

        /// <summary>
        /// Get all auto-calculated goals
        /// </summary>
        public async Task<IEnumerable<Goal>> GetAutoCalculatedGoalsAsync(CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal
                WHERE CalculationSource = 'auto_calculated'
                AND Status IN ('active', 'draft')
                ORDER BY UpdatedOn DESC";

            return await Connection.QueryAsync<Goal>(sql, transaction: Transaction);
        }

        /// <summary>
        /// Get all goals with failed calculations
        /// </summary>
        public async Task<IEnumerable<Goal>> GetFailedCalculationGoalsAsync(CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal
                WHERE CalculationFailed = TRUE
                AND CalculationSource = 'auto_calculated'
                AND Status IN ('active', 'draft')
                ORDER BY LastCalculatedAt DESC";

            return await Connection.QueryAsync<Goal>(sql, transaction: Transaction);
        }

        private void BuildWhereClause(SqlBuilder sqlBuilder, GoalQueryRequest query)
        {
            if (!string.IsNullOrEmpty(query.OwnerType))
                sqlBuilder.Where("OwnerType = @OwnerType", new { query.OwnerType });

            if (query.OwnerId.HasValue)
                sqlBuilder.Where("OwnerId = @OwnerId", new { query.OwnerId });

            if (!string.IsNullOrEmpty(query.Timeframe))
                sqlBuilder.Where("Timeframe = @Timeframe", new { query.Timeframe });

            if (!string.IsNullOrEmpty(query.Status))
                sqlBuilder.Where("Status = @Status", new { query.Status });

            if (!string.IsNullOrEmpty(query.Type))
                sqlBuilder.Where("Type = @Type", new { query.Type });

            if (query.Recurring.HasValue)
                sqlBuilder.Where("Recurring = @Recurring", new { query.Recurring });

            if (query.StartDateFrom.HasValue)
                sqlBuilder.Where("StartDate >= @StartDateFrom", new { query.StartDateFrom });

            if (query.StartDateTo.HasValue)
                sqlBuilder.Where("StartDate <= @StartDateTo", new { query.StartDateTo });

            if (query.EndDateFrom.HasValue)
                sqlBuilder.Where("EndDate >= @EndDateFrom", new { query.EndDateFrom });

            if (query.EndDateTo.HasValue)
                sqlBuilder.Where("EndDate <= @EndDateTo", new { query.EndDateTo });

            if (query.ProgressMin.HasValue)
                sqlBuilder.Where("Progress >= @ProgressMin", new { query.ProgressMin });

            if (query.ProgressMax.HasValue)
                sqlBuilder.Where("Progress <= @ProgressMax", new { query.ProgressMax });

            if (!string.IsNullOrEmpty(query.SearchTerm))
                sqlBuilder.Where("(Name LIKE @SearchTerm OR Description LIKE @SearchTerm)", new { SearchTerm = $"%{query.SearchTerm}%" });
        }

        private void BuildMetricsWhereClause(SqlBuilder sqlBuilder, GoalMetricsRequest request)
        {
            if (!string.IsNullOrEmpty(request.OwnerType))
                sqlBuilder.Where("OwnerType = @OwnerType", new { request.OwnerType });

            if (request.OwnerId.HasValue)
                sqlBuilder.Where("OwnerId = @OwnerId", new { request.OwnerId });

            if (!string.IsNullOrEmpty(request.Timeframe))
                sqlBuilder.Where("Timeframe = @Timeframe", new { request.Timeframe });

            if (!string.IsNullOrEmpty(request.Type))
                sqlBuilder.Where("Type = @Type", new { request.Type });

            if (!string.IsNullOrEmpty(request.Status))
                sqlBuilder.Where("Status = @Status", new { request.Status });

            if (request.StartDate.HasValue)
                sqlBuilder.Where("StartDate >= @StartDate", new { request.StartDate });

            if (request.EndDate.HasValue)
                sqlBuilder.Where("EndDate <= @EndDate", new { request.EndDate });
        }

        private string BuildMetricsOrderBy(string? sortBy, string? sortOrder)
        {
            var order = string.Equals(sortOrder, "asc", StringComparison.OrdinalIgnoreCase) ? "ASC" : "DESC";
            return (sortBy ?? string.Empty).ToLower() switch
            {
                "totalprogress" => $"TotalProgress {order}",
                "totaltargetvalue" => $"TotalTargetValue {order}",
                "totalgoals" => $"TotalGoals {order}",
                "averageprogress" => $"AverageProgress {order}",
                _ => $"AverageProgress {order}"
            };
        }
    }
}
