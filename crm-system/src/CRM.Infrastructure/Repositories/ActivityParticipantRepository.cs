using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    public class ActivityParticipantRepository : DapperRepository<ActivityParticipant, long>, IActivityParticipantRepository
    {
        public ActivityParticipantRepository(IUnitOfWork unitOfWork) : base(unitOfWork)
        {
        }

        public new async Task<ActivityParticipant?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            return await base.GetByIdAsync(id, ct);
        }

        public async Task<long> CreateAsync(ActivityParticipant participant, CancellationToken ct = default)
        {
            return await base.AddAsync(participant, ct);
        }

        public new async Task<bool> UpdateAsync(ActivityParticipant participant, CancellationToken ct = default)
        {
            await base.UpdateAsync(participant, ct);
            return true;
        }

        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        public async Task<PagedResult<ActivityParticipant>> QueryAsync(ActivityParticipantQueryRequest query, CancellationToken ct = default)
        {
            var sql = @"SELECT * FROM crm_activity_participant WHERE 1=1";
            var countSql = @"SELECT COUNT(1) FROM crm_activity_participant WHERE 1=1";
            var parameters = new DynamicParameters();
            var whereClauses = new List<string>();

            if (query.ActivityId.HasValue)
            {
                whereClauses.Add(" AND ActivityId = @ActivityId");
                parameters.Add("ActivityId", query.ActivityId.Value);
            }
            if (query.ContactId.HasValue)
            {
                whereClauses.Add(" AND ContactId = @ContactId");
                parameters.Add("ContactId", query.ContactId.Value);
            }
            if (query.UserId.HasValue)
            {
                whereClauses.Add(" AND UserId = @UserId");
                parameters.Add("UserId", query.UserId.Value);
            }
            if (!string.IsNullOrEmpty(query.Role))
            {
                whereClauses.Add(" AND Role = @Role");
                parameters.Add("Role", query.Role);
            }

            sql += string.Join("", whereClauses);
            countSql += string.Join("", whereClauses);

            var orderBy = !string.IsNullOrEmpty(query.OrderBy) ? query.OrderBy : "-Id";
            // Translate simple -field to ORDER BY
            var orderClause = orderBy.StartsWith('-') ? $"{orderBy[1..]} DESC" : $"{orderBy} ASC";
            sql += $" ORDER BY {orderClause}";

            sql += " LIMIT @PageSize OFFSET @Offset";
            parameters.Add("PageSize", query.PageSize);
            parameters.Add("Offset", (query.Page - 1) * query.PageSize);

            var connection = Connection;
            var transaction = Transaction;

            using var multi = await connection.QueryMultipleAsync($"{sql}; {countSql}", parameters, transaction);
            var items = await multi.ReadAsync<ActivityParticipant>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<ActivityParticipant>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        public async Task<IEnumerable<ActivityParticipant>> GetByActivityIdAsync(long activityId, CancellationToken ct = default)
        {
            var sql = @"SELECT * FROM crm_activity_participant WHERE ActivityId = @ActivityId ORDER BY Id DESC";
            return await Connection.QueryAsync<ActivityParticipant>(sql, new { ActivityId = activityId }, Transaction);
        }
    }
}

