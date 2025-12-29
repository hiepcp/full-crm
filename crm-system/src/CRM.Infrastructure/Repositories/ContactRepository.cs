using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Utils;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;
using static Dapper.SqlBuilder;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Contact repository implementation using Dapper
    /// </summary>
    public class ContactRepository : DapperRepository<Contact, long>, IContactRepository
    {
        public ContactRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query contacts with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<Contact>> QueryAsync(ContactQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("Id, CustomerId, Salutation, FirstName, MiddleName, LastName, Email, Phone, MobilePhone, Fax, JobTitle, Address, Notes, IsPrimary, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_contact /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_contact /**where**/
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

            var items = await multi.ReadAsync<Contact>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Contact>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Create new contact
        /// </summary>
        public async Task<long> CreateAsync(Contact contact, CancellationToken ct = default)
        {
            return await base.AddAsync(contact, ct);
        }

        /// <summary>
        /// Update existing contact
        /// </summary>
        public new async Task<bool> UpdateAsync(Contact contact, CancellationToken ct = default)
        {
            await base.UpdateAsync(contact, ct);
            return true;
        }

        /// <summary>
        /// Delete contact by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Get contact by ID
        /// </summary>
        public new async Task<Contact?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT Id, CustomerId, Salutation, FirstName, MiddleName, LastName, Email, Phone, MobilePhone, Fax, JobTitle, Address, Notes, IsPrimary, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy FROM crm_contact WHERE Id = @Id";

            var contact = await Connection.QuerySingleOrDefaultAsync<Contact>(
                sql, new { Id = id }, Transaction);

            return contact;
        }

        /// <summary>
        /// Check if contact exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var contact = await GetByIdAsync(id, ct);
            return contact != null;
        }

        /// <summary>
        /// Get contacts by customer ID
        /// </summary>
        public async Task<IEnumerable<Contact>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Contact>(
                "SELECT Id, CustomerId, Salutation, FirstName, MiddleName, LastName, Email, Phone, MobilePhone, Fax, JobTitle, Address, Notes, IsPrimary, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy FROM crm_contact WHERE CustomerId = @CustomerId ORDER BY IsPrimary DESC, UpdatedOn DESC",
                new { CustomerId = customerId },
                Transaction);
        }

        /// <summary>
        /// Get contacts by owner ID
        /// </summary>
        /// <summary>
        /// Get primary contact by customer ID
        /// </summary>
        public async Task<Contact?> GetPrimaryByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            return await Connection.QuerySingleOrDefaultAsync<Contact>(
                "SELECT Id, CustomerId, Salutation, FirstName, MiddleName, LastName, Email, Phone, MobilePhone, Fax, JobTitle, Address, Notes, IsPrimary, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy FROM crm_contact WHERE CustomerId = @CustomerId AND IsPrimary = 1 ORDER BY UpdatedOn DESC LIMIT 1",
                new { CustomerId = customerId },
                Transaction);
        }

        /// <summary>
        /// Build WHERE clause from query parameters using generic filter processing
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, ContactQueryRequest query)
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
        /// Parse order by string - maps client field names to database columns
        /// Client sends any case, we match to database PascalCase columns
        /// </summary>
        private string ParseOrderBy(string orderBy)
        {
            return FieldMapper.ParseOrderBy(orderBy);
        }

        /// <summary>
        /// Get contact by email
        /// </summary>
        public async Task<Contact?> GetByEmailAsync(string email, CancellationToken ct = default)
        {
            const string sql = @"SELECT Id, CustomerId, Salutation, FirstName, MiddleName, LastName, Email, Phone, MobilePhone, Fax, JobTitle, Address, Notes, IsPrimary, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
                                FROM crm_contact WHERE Email = @Email LIMIT 1";

            return await Connection.QuerySingleOrDefaultAsync<Contact>(
                sql, new { Email = email }, Transaction);
        }

        /// <summary>
        /// Get deals by contact ID
        /// </summary>
        /// <param name="contactId">The contact ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of deals associated with the contact</returns>
        public async Task<IEnumerable<Deal>> GetDealsByContactAsync(long contactId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_deal WHERE ContactId = @ContactId";

            var deals = await Connection.QueryMultipleAsync(
                sql, new { ContactId = contactId }, Transaction);

            var items = await deals.ReadAsync<Deal>();

            return items;
        }

        /// <summary>
        /// Get activities by contact ID
        /// </summary>
        /// <param name="contactId">The contact ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of activities associated with the contact</returns>
        public async Task<IEnumerable<Activity>> GetActivitiesByContactAsync(long contactId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_activity WHERE RelationType = @RelationType AND RelationId = @RelationId";

            var activities = await Connection.QueryMultipleAsync(
                sql, new { RelationType = "contact", RelationId = contactId }, Transaction);

            var items = await activities.ReadAsync<Activity>();

            return items;
        }

        /// <summary>
        /// Set contact as primary (and unset other primary contacts of same customer)
        /// </summary>
        public async Task<bool> SetAsPrimaryAsync(long id, CancellationToken ct = default)
        {
            var sql = "UPDATE crm_contact SET IsPrimary = 1, UpdatedOn = @UpdatedOn WHERE Id = @Id";
            var rowsAffected = await Connection.ExecuteAsync(sql, new { Id = id, UpdatedOn = DateTime.UtcNow }, Transaction);
            return rowsAffected > 0;
        }

        /// <summary>
        /// Unset primary flag for all contacts of a customer
        /// </summary>
        public async Task<int> UnsetPrimaryAsync(long? customerId, CancellationToken ct = default)
        {
            var sql = "UPDATE crm_contact SET IsPrimary = 0, UpdatedOn = @UpdatedOn WHERE CustomerId = @CustomerId";
            return await Connection.ExecuteAsync(sql, new { CustomerId = customerId, UpdatedOn = DateTime.UtcNow }, Transaction);
        }

        /// <summary>
        /// Check if email is unique
        /// </summary>
        public async Task<bool> IsEmailUniqueAsync(string email, long? excludeId = null, CancellationToken ct = default)
        {
            var sql = @"SELECT COUNT(1) FROM crm_contact WHERE Email IS NOT NULL AND LOWER(TRIM(Email)) = LOWER(TRIM(@Email))";
            if (excludeId.HasValue)
            {
                sql += " AND Id <> @ExcludeId";
            }

            var count = await Connection.ExecuteScalarAsync<int>(sql, new { Email = email, ExcludeId = excludeId }, Transaction);
            return count == 0;
        }
    }
}
