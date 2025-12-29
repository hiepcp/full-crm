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
    /// Quotation repository implementation using Dapper
    /// </summary>
    public class QuotationRepository : DapperRepository<Quotation, long>, IQuotationRepository
    {
        public QuotationRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query quotations with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<Quotation>> QueryAsync(QuotationQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_quotation /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_quotation /**where**/
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

            var items = await multi.ReadAsync<Quotation>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Quotation>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Get quotation by ID
        /// </summary>
        public new async Task<Quotation?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_quotation WHERE Id = @Id";

            var quotation = await Connection.QuerySingleOrDefaultAsync<Quotation>(
                sql, new { Id = id }, Transaction);

            return quotation;
        }

        /// <summary>
        /// Create new quotation
        /// </summary>
        public async Task<long> CreateAsync(Quotation quotation, CancellationToken ct = default)
        {
            return await base.AddAsync(quotation, ct);
        }

        /// <summary>
        /// Update existing quotation
        /// </summary>
        public new async Task<bool> UpdateAsync(Quotation quotation, CancellationToken ct = default)
        {
            await base.UpdateAsync(quotation, ct);
            return true;
        }

        /// <summary>
        /// Delete quotation by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if quotation exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var quotation = await GetByIdAsync(id, ct);
            return quotation != null;
        }

        /// <summary>
        /// Get quotations by status
        /// </summary>
        public async Task<IEnumerable<Quotation>> GetByStatusAsync(string status, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Quotation>(
                "SELECT * FROM crm_quotation WHERE Status = @Status ORDER BY UpdatedOn DESC",
                new { Status = status },
                Transaction);
        }

        /// <summary>
        /// Get quotations by quotation number
        /// </summary>
        public async Task<Quotation?> GetByQuotationNumberAsync(string quotationNumber, CancellationToken ct = default)
        {
            return await Connection.QuerySingleOrDefaultAsync<Quotation>(
                "SELECT * FROM crm_quotation WHERE QuotationNumber = @QuotationNumber",
                new { QuotationNumber = quotationNumber },
                Transaction);
        }

        /// <summary>
        /// Get quotations by customer ID
        /// </summary>
        public async Task<IEnumerable<Quotation>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Quotation>(
                "SELECT * FROM crm_quotation WHERE CustomerId = @CustomerId ORDER BY UpdatedOn DESC",
                new { CustomerId = customerId },
                Transaction);
        }

        /// <summary>
        /// Build WHERE clause from query parameters
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, QuotationQueryRequest query)
        {
            if (!string.IsNullOrEmpty(query.QuotationNumber))
                sqlBuilder.Where("QuotationNumber LIKE @QuotationNumber", new { QuotationNumber = $"%{query.QuotationNumber}%" });

            if (!string.IsNullOrEmpty(query.Name))
                sqlBuilder.Where("Name LIKE @Name", new { Name = $"%{query.Name}%" });

            if (query.MinTotalAmount.HasValue)
                sqlBuilder.Where("TotalAmount >= @MinTotalAmount", new { MinTotalAmount = query.MinTotalAmount.Value });

            if (query.MaxTotalAmount.HasValue)
                sqlBuilder.Where("TotalAmount <= @MaxTotalAmount", new { MaxTotalAmount = query.MaxTotalAmount.Value });

            if (!string.IsNullOrEmpty(query.Status))
                sqlBuilder.Where("Status = @Status", new { Status = query.Status });

            if (query.ValidUntilFrom.HasValue)
                sqlBuilder.Where("ValidUntil >= @ValidUntilFrom", new { ValidUntilFrom = query.ValidUntilFrom.Value });

            if (query.ValidUntilTo.HasValue)
                sqlBuilder.Where("ValidUntil <= @ValidUntilTo", new { ValidUntilTo = query.ValidUntilTo.Value });

            if (query.CustomerId.HasValue)
                sqlBuilder.Where("CustomerId = @CustomerId", new { CustomerId = query.CustomerId.Value });
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
                "quotationNumber",
                "name",
                "description",
                "totalAmount",
                "status",
                "validUntil",
                "notes",
                "customerId",
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
                        "quotationNumber" => "QuotationNumber",
                        "name" => "Name",
                        "description" => "Description",
                        "totalAmount" => "TotalAmount",
                        "status" => "Status",
                        "validUntil" => "ValidUntil",
                        "notes" => "Notes",
                        "customerId" => "CustomerId",
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

        /// <summary>
        /// Get quotations that are not linked to any deal
        /// </summary>
        public async Task<IEnumerable<Quotation>> GetUnlinkedQuotationsAsync(CancellationToken ct = default)
        {
            const string sql = @"
                SELECT q.* FROM crm_quotation q
                LEFT JOIN crm_deal_quotation dq ON q.QuotationNumber = dq.QuotationNumber
                WHERE dq.QuotationNumber IS NULL
                ORDER BY q.UpdatedOn DESC";

            return await Connection.QueryAsync<Quotation>(sql, transaction: Transaction);
        }
    }
}
