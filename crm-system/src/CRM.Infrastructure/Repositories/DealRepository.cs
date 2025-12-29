using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using static Dapper.SqlBuilder;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;
using System.Collections.Generic;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Deal repository implementation using Dapper
    /// </summary>
    public class DealRepository : DapperRepository<Deal, long>, IDealRepository
    {
        public DealRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query deals with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<Deal>> QueryAsync(DealQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_deal /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_deal /**where**/
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

            var items = await multi.ReadAsync<Deal>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Deal>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Get deal by ID
        /// </summary>
        public new async Task<Deal?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_deal WHERE Id = @Id";

            var deal = await Connection.QuerySingleOrDefaultAsync<Deal>(
                sql, new { Id = id }, Transaction);

            return deal;
        }

        /// <summary>
        /// Create new deal
        /// </summary>
        public async Task<long> CreateAsync(Deal deal, CancellationToken ct = default)
        {
            return await base.AddAsync(deal, ct);
        }

        /// <summary>
        /// Update existing deal
        /// </summary>
        public new async Task<bool> UpdateAsync(Deal deal, CancellationToken ct = default)
        {
            await base.UpdateAsync(deal, ct);
            return true;
        }

        /// <summary>
        /// Delete deal by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if deal exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var deal = await GetByIdAsync(id, ct);
            return deal != null;
        }

        /// <summary>
        /// Get deals by owner ID
        /// </summary>
        public async Task<IEnumerable<Deal>> GetByOwnerIdAsync(long ownerId, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Deal>(
                "SELECT * FROM crm_deal WHERE OwnerId = @OwnerId ORDER BY UpdatedOn DESC",
                new { OwnerId = ownerId },
                Transaction);
        }

        /// <summary>
        /// Get deals by stage
        /// </summary>
        public async Task<IEnumerable<Deal>> GetByStageAsync(string stage, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Deal>(
                "SELECT * FROM crm_deal WHERE Stage = @Stage ORDER BY UpdatedOn DESC",
                new { Stage = stage },
                Transaction);
        }

        /// <summary>
        /// Get deals with follow-up due on specific date
        /// </summary>
        public async Task<IEnumerable<Deal>> GetDealsWithFollowUpDueAsync(DateTime date, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * 
                FROM crm_deal
                WHERE DATE(FollowUpDate) = DATE(@Date)
                  AND Stage NOT IN ('Closed Won', 'Closed Lost')";

            return await Connection.QueryAsync<Deal>(sql, new { Date = date }, Transaction);
        }

        /// <summary>
        /// Get deals by customer ID
        /// </summary>
        public async Task<IEnumerable<Deal>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Deal>(
                "SELECT * FROM crm_deal WHERE CustomerId = @CustomerId ORDER BY UpdatedOn DESC",
                new { CustomerId = customerId },
                Transaction);
        }

        /// <summary>
        /// Build WHERE clause from query parameters
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, DealQueryRequest query)
        {
            if (query.CustomerId.HasValue)
                sqlBuilder.Where("CustomerId = @CustomerId", new { CustomerId = query.CustomerId.Value });

            if (query.OwnerId.HasValue)
                sqlBuilder.Where("OwnerId = @OwnerId", new { OwnerId = query.OwnerId.Value });

            if (query.LeadId.HasValue)
                sqlBuilder.Where("LeadId = @LeadId", new { LeadId = query.LeadId.Value });

            if (!string.IsNullOrEmpty(query.Stage))
                sqlBuilder.Where("Stage = @Stage", new { Stage = query.Stage });

            if (query.ContactId.HasValue)
                sqlBuilder.Where("ContactId = @ContactId", new { ContactId = query.ContactId.Value });

            if (query.MinExpectedRevenue.HasValue)
                sqlBuilder.Where("ExpectedRevenue >= @MinExpectedRevenue", new { MinExpectedRevenue = query.MinExpectedRevenue.Value });

            if (query.MaxExpectedRevenue.HasValue)
                sqlBuilder.Where("ExpectedRevenue <= @MaxExpectedRevenue", new { MaxExpectedRevenue = query.MaxExpectedRevenue.Value });

            if (query.CloseDateFrom.HasValue)
                sqlBuilder.Where("CloseDate >= @CloseDateFrom", new { CloseDateFrom = query.CloseDateFrom.Value });

            if (query.CloseDateTo.HasValue)
                sqlBuilder.Where("CloseDate <= @CloseDateTo", new { CloseDateTo = query.CloseDateTo.Value });
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
                "name",
                "description",
                "stage",
                "expectedRevenue",
                "actualRevenue",
                "closeDate",
                "customerId",
                "ownerId",
                "leadId",
                "contactId",
                "note",
                "createdOn",
                "updatedOn"
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
                if (allowedFields.Any(x => x.Equals(field, StringComparison.OrdinalIgnoreCase)))
                {
                    // Map to actual database column names
                    var dbField = field.ToLower() switch
                    {
                        "id" => "Id",
                        "name" => "Name",
                        "description" => "Description",
                        "stage" => "Stage",
                        "expectedrevenue" => "ExpectedRevenue",
                        "actualrevenue" => "ActualRevenue",
                        "closedate" => "CloseDate",
                        "customerid" => "CustomerId",
                        "ownerid" => "OwnerId",
                        "leadid" => "LeadId",
                        "contactid" => "ContactId",
                        "note" => "Note",
                        "createdon" => "CreatedOn",
                        "updatedon" => "UpdatedOn",
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
