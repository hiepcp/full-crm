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
    /// DealQuotation repository implementation using Dapper
    /// </summary>
    public class DealQuotationRepository : DapperRepository<DealQuotation, long>, IDealQuotationRepository
    {
        public DealQuotationRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query deal quotations with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<DealQuotation>> QueryAsync(DealQuotationQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_deal_quotation /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_deal_quotation /**where**/
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

            var items = await connection.QueryAsync<DealQuotation>(selector.RawSql, selector.Parameters, transaction);
            var totalCount = await connection.ExecuteScalarAsync<int>(countSelector.RawSql, countSelector.Parameters, transaction);

            return new PagedResult<DealQuotation>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Create new deal quotation link
        /// </summary>
        public async Task<long> CreateAsync(DealQuotation dealQuotation, CancellationToken ct = default)
        {
            return await base.AddAsync(dealQuotation, ct);
        }

        /// <summary>
        /// Bulk insert multiple deal quotations
        /// </summary>
        public async Task BulkInsertAsync(IEnumerable<DealQuotation> dealQuotations, CancellationToken ct = default)
        {
            const string sql = @"
                INSERT INTO crm_deal_quotation (DealId, QuotationNumber, CreatedOn, CreatedBy)
                VALUES (@DealId, @QuotationNumber, @CreatedOn, @CreatedBy)";

            await Connection.ExecuteAsync(sql, dealQuotations, Transaction);
        }

        /// <summary>
        /// Get quotations by deal ID
        /// </summary>
        public async Task<IEnumerable<DealQuotation>> GetByDealIdAsync(long dealId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_deal_quotation WHERE DealId = @DealId ORDER BY CreatedOn DESC";

            return await Connection.QueryAsync<DealQuotation>(sql, new { DealId = dealId }, Transaction);
        }

        /// <summary>
        /// Get deals by quotation number
        /// </summary>
        public async Task<IEnumerable<DealQuotation>> GetByQuotationNumberAsync(string quotationNumber, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_deal_quotation WHERE QuotationNumber = @QuotationNumber ORDER BY CreatedOn DESC";

            return await Connection.QueryAsync<DealQuotation>(sql, new { QuotationNumber = quotationNumber }, Transaction);
        }

        /// <summary>
        /// Delete deal quotation link by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Delete all quotations for a deal
        /// </summary>
        public async Task<int> DeleteByDealIdAsync(long dealId, CancellationToken ct = default)
        {
            const string sql = "DELETE FROM crm_deal_quotation WHERE DealId = @DealId";

            return await Connection.ExecuteAsync(sql, new { DealId = dealId }, Transaction);
        }

        /// <summary>
        /// Build WHERE clause for query
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, DealQuotationQueryRequest query)
        {
            // DealId filter
            if (query.DealId.HasValue)
            {
                sqlBuilder.Where("DealId = @DealId", new { DealId = query.DealId.Value });
            }

            // QuotationNumber filter
            if (!string.IsNullOrWhiteSpace(query.QuotationNumber))
            {
                sqlBuilder.Where("QuotationNumber = @QuotationNumber", new { QuotationNumber = query.QuotationNumber });
            }

            // Created date range filters
            if (query.CreatedFrom.HasValue)
            {
                sqlBuilder.Where("CreatedOn >= @CreatedFrom", new { CreatedFrom = query.CreatedFrom.Value });
            }

            if (query.CreatedTo.HasValue)
            {
                sqlBuilder.Where("CreatedOn <= @CreatedTo", new { CreatedTo = query.CreatedTo.Value });
            }

            // Updated date range filters
            if (query.UpdatedFrom.HasValue)
            {
                sqlBuilder.Where("UpdatedOn >= @UpdatedFrom", new { UpdatedFrom = query.UpdatedFrom.Value });
            }

            if (query.UpdatedTo.HasValue)
            {
                sqlBuilder.Where("UpdatedOn <= @UpdatedTo", new { UpdatedTo = query.UpdatedTo.Value });
            }
        }

        /// <summary>
        /// Parse order by string
        /// </summary>
        private string ParseOrderBy(string orderBy)
        {
            if (string.IsNullOrWhiteSpace(orderBy))
                return "CreatedOn DESC";

            // Basic parsing for simple order by like "CreatedOn" or "-CreatedOn"
            if (orderBy.StartsWith("-"))
            {
                var field = orderBy.Substring(1);
                return $"{field} DESC";
            }

            return $"{orderBy} ASC";
        }
    }
}
