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
    /// PipelineLog repository implementation using Dapper
    /// </summary>
    public class PipelineLogRepository : DapperRepository<PipelineLog, long>, IPipelineLogRepository
    {
        public PipelineLogRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query pipeline logs with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<PipelineLog>> QueryAsync(PipelineLogQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_pipeline_log /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_pipeline_log /**where**/
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
                sqlBuilder.OrderBy("ChangedAt DESC");
            }

            // Execute queries
            var connection = Connection;
            var transaction = Transaction;

            using var multi = await connection.QueryMultipleAsync(
                $"{selector.RawSql}; {countSelector.RawSql}",
                selector.Parameters,
                transaction);

            var items = await multi.ReadAsync<PipelineLog>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<PipelineLog>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Get pipeline log by ID
        /// </summary>
        public new async Task<PipelineLog?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_pipeline_log WHERE Id = @Id";

            var pipelineLog = await Connection.QuerySingleOrDefaultAsync<PipelineLog>(
                sql, new { Id = id }, Transaction);

            return pipelineLog;
        }

        /// <summary>
        /// Create new pipeline log
        /// </summary>
        public async Task<long> CreateAsync(PipelineLog pipelineLog, CancellationToken ct = default)
        {
            return await base.AddAsync(pipelineLog, ct);
        }

        /// <summary>
        /// Update existing pipeline log
        /// </summary>
        public new async Task<bool> UpdateAsync(PipelineLog pipelineLog, CancellationToken ct = default)
        {
            await base.UpdateAsync(pipelineLog, ct);
            return true;
        }

        /// <summary>
        /// Delete pipeline log by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if pipeline log exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var pipelineLog = await GetByIdAsync(id, ct);
            return pipelineLog != null;
        }

        /// <summary>
        /// Get pipeline logs by deal ID
        /// </summary>
        public async Task<IEnumerable<PipelineLog>> GetByDealIdAsync(long dealId, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<PipelineLog>(
                "SELECT * FROM crm_pipeline_log WHERE DealId = @DealId ORDER BY ChangedAt DESC",
                new { DealId = dealId },
                Transaction);
        }

        /// <summary>
        /// Get pipeline logs by stage
        /// </summary>
        public async Task<IEnumerable<PipelineLog>> GetByStageAsync(string stage, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<PipelineLog>(
                "SELECT * FROM crm_pipeline_log WHERE NewStage = @Stage ORDER BY ChangedAt DESC",
                new { Stage = stage },
                Transaction);
        }

        /// <summary>
        /// Build WHERE clause for pipeline log queries
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, PipelineLogQueryRequest query)
        {
            if (query.DealId.HasValue)
            {
                sqlBuilder.Where("DealId = @DealId", new { DealId = query.DealId });
            }

            if (!string.IsNullOrEmpty(query.OldStage))
            {
                sqlBuilder.Where("OldStage = @OldStage", new { OldStage = query.OldStage });
            }

            if (!string.IsNullOrEmpty(query.NewStage))
            {
                sqlBuilder.Where("NewStage = @NewStage", new { NewStage = query.NewStage });
            }

            if (!string.IsNullOrEmpty(query.ChangedBy))
            {
                sqlBuilder.Where("ChangedBy LIKE @ChangedBy", new { ChangedBy = $"%{query.ChangedBy}%" });
            }

            if (query.ChangedAtFrom.HasValue)
            {
                sqlBuilder.Where("ChangedAt >= @ChangedAtFrom", new { ChangedAtFrom = query.ChangedAtFrom });
            }

            if (query.ChangedAtTo.HasValue)
            {
                sqlBuilder.Where("ChangedAt <= @ChangedAtTo", new { ChangedAtTo = query.ChangedAtTo });
            }

            if (query.CreatedOnFrom.HasValue)
            {
                sqlBuilder.Where("CreatedOn >= @CreatedOnFrom", new { CreatedOnFrom = query.CreatedOnFrom });
            }

            if (query.CreatedOnTo.HasValue)
            {
                sqlBuilder.Where("CreatedOn <= @CreatedOnTo", new { CreatedOnTo = query.CreatedOnTo });
            }
        }

        /// <summary>
        /// Parse order by string for SQL building
        /// </summary>
        private string ParseOrderBy(string orderBy)
        {
            // Simple parsing - can be enhanced for more complex ordering
            var parts = orderBy.Split(' ');
            if (parts.Length == 2 && parts[1].ToLower() == "desc")
            {
                return $"{parts[0]} DESC";
            }
            return parts[0];
        }
    }
}
