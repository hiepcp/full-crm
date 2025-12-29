using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    public class ActivityAttachmentRepository : DapperRepository<ActivityAttachment, long>, IActivityAttachmentRepository
    {
        public ActivityAttachmentRepository(IUnitOfWork unitOfWork) : base(unitOfWork)
        {
        }

        public new async Task<ActivityAttachment?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            return await base.GetByIdAsync(id, ct);
        }

        public async Task<long> CreateAsync(ActivityAttachment entity, CancellationToken ct = default)
        {
            return await base.AddAsync(entity, ct);
        }

        public new async Task<bool> UpdateAsync(ActivityAttachment entity, CancellationToken ct = default)
        {
            await base.UpdateAsync(entity, ct);
            return true;
        }

        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        public async Task<PagedResult<ActivityAttachment>> QueryAsync(ActivityAttachmentQueryRequest query, CancellationToken ct = default)
        {
            var sql = @"SELECT * FROM crm_activity_attachment WHERE 1=1";
            var countSql = @"SELECT COUNT(1) FROM crm_activity_attachment WHERE 1=1";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();

            if (query.ActivityId.HasValue)
            {
                whereClauses.Add(" AND ActivityId = @ActivityId");
                parameters.Add("ActivityId", query.ActivityId.Value);
            }

            sql += string.Join("", whereClauses);
            countSql += string.Join("", whereClauses);

            var orderBy = !string.IsNullOrEmpty(query.OrderBy) ? query.OrderBy : "-Id";
            var orderClause = orderBy.StartsWith('-') ? $"{orderBy[1..]} DESC" : $"{orderBy} ASC";
            sql += $" ORDER BY {orderClause}";

            sql += " LIMIT @PageSize OFFSET @Offset";
            parameters.Add("PageSize", query.PageSize);
            parameters.Add("Offset", (query.Page - 1) * query.PageSize);

            var connection = Connection;
            var transaction = Transaction;
            using var multi = await connection.QueryMultipleAsync($"{sql}; {countSql}", parameters, transaction);
            var items = await multi.ReadAsync<ActivityAttachment>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<ActivityAttachment>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        public async Task<IEnumerable<ActivityAttachment>> GetByActivityAsync(long activityId, CancellationToken ct = default)
        {
            var sql = @"SELECT * FROM crm_activity_attachment WHERE ActivityId = @ActivityId ORDER BY Id DESC";
            return await Connection.QueryAsync<ActivityAttachment>(sql, new { ActivityId = activityId }, Transaction);
        }
    }
}

