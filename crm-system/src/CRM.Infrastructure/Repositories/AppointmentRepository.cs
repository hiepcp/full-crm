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
    public class AppointmentRepository : DapperRepository<Appointment, long>, IAppointmentRepository
    {
        public AppointmentRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        public async Task<PagedResult<Appointment>> QueryAsync(AppointmentQueryRequest query, CancellationToken ct = default)
        {
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_appointment /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_appointment /**where**/
            ");

            BuildWhereClause(sqlBuilder, query);

            if (!string.IsNullOrEmpty(query.OrderBy))
            {
                sqlBuilder.OrderBy(ParseOrderBy(query.OrderBy));
            }
            else
            {
                sqlBuilder.OrderBy("StartDateTime DESC");
            }

            using var multi = await Connection.QueryMultipleAsync(
                $"{selector.RawSql}; {countSelector.RawSql}",
                selector.Parameters,
                Transaction);

            var items = await multi.ReadAsync<Appointment>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Appointment>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        public new async Task<Appointment?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            return await base.GetByIdAsync(id, ct);
        }

        public async Task<Appointment?> GetByMailIdAsync(string mailId, CancellationToken ct = default)
        {
            return await Connection.QueryFirstOrDefaultAsync<Appointment>(
                "SELECT * FROM crm_appointment WHERE MailId = @MailId LIMIT 1",
                new { MailId = mailId },
                Transaction);
        }

        public async Task<long> CreateAsync(Appointment appointment, CancellationToken ct = default)
        {
            return await base.AddAsync(appointment, ct);
        }

        public new async Task<bool> UpdateAsync(Appointment appointment, CancellationToken ct = default)
        {
            await base.UpdateAsync(appointment, ct);
            return true;
        }

        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var appointment = await GetByIdAsync(id, ct);
            return appointment != null;
        }

        private void BuildWhereClause(SqlBuilder sqlBuilder, AppointmentQueryRequest query)
        {
            if (!string.IsNullOrEmpty(query.MailId))
                sqlBuilder.Where("MailId = @MailId", new { query.MailId });
            if (!string.IsNullOrEmpty(query.ICalUId))
                sqlBuilder.Where("ICalUId = @ICalUId", new { query.ICalUId });
            if (!string.IsNullOrEmpty(query.ConversationId))
                sqlBuilder.Where("ConversationId = @ConversationId", new { query.ConversationId });
            if (query.ActivityId.HasValue)
                sqlBuilder.Where("ActivityId = @ActivityId", new { query.ActivityId });
            if (query.StartFrom.HasValue)
                sqlBuilder.Where("StartDateTime >= @StartFrom", new { query.StartFrom });
            if (query.StartTo.HasValue)
                sqlBuilder.Where("StartDateTime <= @StartTo", new { query.StartTo });
            if (query.EndFrom.HasValue)
                sqlBuilder.Where("EndDateTime >= @EndFrom", new { query.EndFrom });
            if (query.EndTo.HasValue)
                sqlBuilder.Where("EndDateTime <= @EndTo", new { query.EndTo });
        }

        private string ParseOrderBy(string orderBy)
        {
            var allowedFields = new HashSet<string>
            {
                "id",
                "mailid",
                "icaluid",
                "conversationid",
                "subject",
                "startdatetime",
                "enddatetime",
                "importance",
                "createdon",
                "updatedon"
            };

            var parts = orderBy.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            var orderClauses = new List<string>();

            foreach (var part in parts)
            {
                var isDesc = part.StartsWith("-");
                var field = isDesc ? part[1..] : part;
                var lowerField = field.ToLower();

                if (!allowedFields.Contains(lowerField))
                    continue;

                var dbField = lowerField switch
                {
                    "id" => "Id",
                    "mailid" => "MailId",
                    "icaluid" => "ICalUId",
                    "conversationid" => "ConversationId",
                    "subject" => "Subject",
                    "startdatetime" => "StartDateTime",
                    "enddatetime" => "EndDateTime",
                    "importance" => "Importance",
                    "createdon" => "CreatedOn",
                    "updatedon" => "UpdatedOn",
                    _ => null
                };

                if (dbField != null)
                {
                    orderClauses.Add($"{dbField} {(isDesc ? "DESC" : "ASC")}");
                }
            }

            return string.Join(", ", orderClauses);
        }
    }
}



