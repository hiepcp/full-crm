using CRMSys.Application.Dtos.Request;
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
    /// <summary>
    /// Lead repository implementation using Dapper
    /// </summary>
    public class LeadRepository : DapperRepository<Lead, long>, ILeadRepository
    {
        static LeadRepository()
        {
            // Initialize common special filter handlers for Lead repository
            //FieldMapper.InitializeCommonSpecialFilters();
        }
        public LeadRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query leads with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<Lead>> QueryAsync(LeadQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, VatNumber, PaymentTerms, Source, Status, OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId, IsDuplicate, DuplicateOf, Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_lead /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_lead /**where**/
            ");

            // Build WHERE clause
            BuildWhereClause(sqlBuilder, query);

            // Build ORDER BY clause
            if (!string.IsNullOrEmpty(query.OrderBy))
            {
                var orderBy = FieldMapper.ParseOrderBy(query.OrderBy);
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

            var items = await multi.ReadAsync<Lead>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Lead>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Create new lead
        /// </summary>
        public async Task<long> CreateAsync(Lead lead, CancellationToken ct = default)
        {
            return await base.AddAsync(lead, ct);
        }

        /// <summary>
        /// Update existing lead
        /// </summary>
        public new async Task<bool> UpdateAsync(Lead lead, CancellationToken ct = default)
        {
            await base.UpdateAsync(lead, ct);
            return true;
        }

        /// <summary>
        /// Delete lead by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Get lead by ID
        /// </summary>
        public new async Task<Lead?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, VatNumber, PaymentTerms, Source, Status, OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId, IsDuplicate, DuplicateOf, Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy FROM crm_lead WHERE Id = @Id";

            var lead = await Connection.QuerySingleOrDefaultAsync<Lead>(
                sql, new { Id = id }, Transaction);

            return lead;
        }

        /// <summary>
        /// Check if lead exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var lead = await GetByIdAsync(id, ct);
            return lead != null;
        }

        /// <summary>
        /// Check if email is unique
        /// </summary>
        public async Task<bool> IsEmailUniqueAsync(string email, long? excludeId = null, CancellationToken ct = default)
        {
            var sql = @"SELECT COUNT(1) FROM crm_lead WHERE Email IS NOT NULL AND LOWER(TRIM(Email)) = LOWER(TRIM(@Email))";
            if (excludeId.HasValue)
            {
                sql += " AND Id <> @ExcludeId";
            }

            var count = await Connection.ExecuteScalarAsync<int>(sql, new { Email = email, ExcludeId = excludeId }, Transaction);
            return count == 0;
        }

        /// <summary>
        /// Check if website is unique
        /// </summary>
        public async Task<bool> IsWebsiteUniqueAsync(string website, long? excludeId = null, CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(website)) return true; // treat empty as unique

            var sql = @"SELECT COUNT(1) FROM crm_lead WHERE LOWER(TRIM(Website)) = LOWER(TRIM(@Website))";
            if (excludeId.HasValue)
            {
                sql += " AND Id <> @ExcludeId";
            }

            var count = await Connection.ExecuteScalarAsync<int>(sql, new { Website = website, ExcludeId = excludeId }, Transaction);
            return count == 0;
        }

        /// <summary>
        /// Get leads by owner ID
        /// </summary>
        public async Task<IEnumerable<Lead>> GetByOwnerIdAsync(long ownerId, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Lead>(
                "SELECT Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, VatNumber, PaymentTerms, Source, Status, OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId, IsDuplicate, DuplicateOf, Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy FROM crm_lead WHERE OwnerId = @OwnerId ORDER BY UpdatedOn DESC",
                new { OwnerId = ownerId },
                Transaction);
        }

        /// <summary>
        /// Get leads by status
        /// </summary>
        public async Task<IEnumerable<Lead>> GetByStatusAsync(string status, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Lead>(
                "SELECT Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, VatNumber, PaymentTerms, Source, Status, OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId, IsDuplicate, DuplicateOf, Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy FROM crm_lead WHERE Status = @Status ORDER BY UpdatedOn DESC",
                new { Status = status },
                Transaction);
        }

        /// <summary>
        /// Get leads by source
        /// </summary>
        public async Task<IEnumerable<Lead>> GetBySourceAsync(string source, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Lead>(
                "SELECT Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, VatNumber, PaymentTerms, Source, Status, OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId, IsDuplicate, DuplicateOf, Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy FROM crm_lead WHERE Source = @Source ORDER BY UpdatedOn DESC",
                new { Source = source },
                Transaction);
        }

        /// <summary>
        /// Get qualified leads
        /// </summary>
        public async Task<IEnumerable<Lead>> GetQualifiedLeadsAsync(int minScore = 70, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Lead>(
                "SELECT Id, Email, TelephoneNo, FirstName, LastName, Company, Website, Country, VatNumber, PaymentTerms, Source, Status, OwnerId, Score, IsConverted, ConvertedAt, CustomerId, ContactId, DealId, IsDuplicate, DuplicateOf, Note, FollowUpDate, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy FROM crm_lead WHERE Score >= @MinScore AND IsConverted = 0 ORDER BY Score DESC, UpdatedOn DESC",
                new { MinScore = minScore },
                Transaction);
        }

        /// <summary>
        /// Convert lead to customer/contact
        /// </summary>
        public async Task<bool> ConvertLeadAsync(long leadId, long customerId, long? contactId = null, CancellationToken ct = default)
        {
            var sql = @"
                UPDATE crm_lead
                SET IsConverted = 1,
                    ConvertedAt = @ConvertedAt,
                    CustomerId = @CustomerId,
                    ContactId = @ContactId,
                    UpdatedOn = @UpdatedAt
                WHERE Id = @LeadId";

            var affectedRows = await Connection.ExecuteAsync(sql, new
            {
                LeadId = leadId,
                CustomerId = customerId,
                ContactId = contactId,
                ConvertedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            }, Transaction);

            return affectedRows > 0;
        }

        /// <summary>
        /// Mark lead as duplicate
        /// </summary>
        public async Task<bool> MarkAsDuplicateAsync(long leadId, long duplicateOfLeadId, CancellationToken ct = default)
        {
            var sql = @"
                UPDATE crm_lead
                SET IsDuplicate = 1,
                    DuplicateOf = @DuplicateOf,
                    UpdatedOn = @UpdatedAt
                WHERE Id = @LeadId";

            var affectedRows = await Connection.ExecuteAsync(sql, new
            {
                LeadId = leadId,
                DuplicateOf = duplicateOfLeadId,
                UpdatedAt = DateTime.UtcNow
            }, Transaction);

            return affectedRows > 0;
        }

        /// <summary>
        /// Bulk update lead status
        /// </summary>
        public async Task<int> BulkUpdateStatusAsync(IEnumerable<long> leadIds, string newStatus, CancellationToken ct = default)
        {
            var sql = @"
                UPDATE crm_lead
                SET Status = @NewStatus,
                    UpdatedOn = @UpdatedAt
                WHERE Id IN @LeadIds";

            return await Connection.ExecuteAsync(sql, new
            {
                NewStatus = newStatus,
                LeadIds = leadIds.ToList(),
                UpdatedAt = DateTime.UtcNow
            }, Transaction);
        }

        /// <summary>
        /// Bulk assign leads to owner
        /// </summary>
        public async Task<int> BulkAssignAsync(IEnumerable<long> leadIds, long ownerId, CancellationToken ct = default)
        {
            var sql = @"
                UPDATE crm_lead
                SET OwnerId = @OwnerId,
                    UpdatedOn = @UpdatedAt
                WHERE Id IN @LeadIds";

            return await Connection.ExecuteAsync(sql, new
            {
                OwnerId = ownerId,
                LeadIds = leadIds.ToList(),
                UpdatedAt = DateTime.UtcNow
            }, Transaction);
        }

        /// <summary>
        /// Get leads with follow-up due on specific date
        /// </summary>
        public async Task<IEnumerable<Lead>> GetLeadsWithFollowUpDueAsync(DateTime date, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * 
                FROM crm_lead
                WHERE DATE(FollowUpDate) = DATE(@Date)
                  AND Status NOT IN ('Converted', 'Lost', 'Cancelled')";

            return await Connection.QueryAsync<Lead>(sql, new { Date = date }, Transaction);
        }

        /// <summary>
        /// Build WHERE clause from query parameters using generic filter processing
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, LeadQueryRequest query)
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
    }
}
