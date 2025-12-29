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
    /// Customer repository implementation using Dapper
    /// </summary>
    public class CustomerRepository : DapperRepository<Customer, long>, ICustomerRepository
    {
        public CustomerRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query customers with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<Customer>> QueryAsync(CustomerQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("*");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_customer /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_customer /**where**/
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

            var items = await multi.ReadAsync<Customer>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<Customer>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Get customer by ID
        /// </summary>
        public new async Task<Customer?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_customer WHERE Id = @Id";

            var customer = await Connection.QuerySingleOrDefaultAsync<Customer>(
                sql, new { Id = id }, Transaction);

            return customer;
        }

        /// <summary>
        /// Get deals by customer ID
        /// </summary>
        /// <param name="customerId">The customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of deals associated with the customer</returns>
        public async Task<IEnumerable<Deal>> GetDealsByCustomerAsync(long customerId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_deal WHERE CustomerId = @CustomerId";

            var deals = await Connection.QueryMultipleAsync(
                sql, new { CustomerId = customerId }, Transaction);


            var items = await deals.ReadAsync<Deal>();

            return items;
        }

        /// <summary>
        /// Get leads by customer ID
        /// </summary>
        /// <param name="customerId">The customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of leads associated with the customer</returns>
        public async Task<IEnumerable<Lead>> GetLeadsByCustomerAsync(long customerId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_lead WHERE CustomerId = @CustomerId";

            var leads = await Connection.QueryMultipleAsync(
                sql, new { CustomerId = customerId }, Transaction);


            var items = await leads.ReadAsync<Lead>();

            return items;
        }

        /// <summary>
        /// Get contacts by customer ID
        /// </summary>
        /// <param name="customerId">The customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of contacts associated with the customer</returns>
        public async Task<IEnumerable<Contact>> GetContactsByCustomerAsync(long customerId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_contact WHERE CustomerId = @CustomerId";

            var contacts = await Connection.QueryMultipleAsync(
                sql, new { CustomerId = customerId }, Transaction);

            var items = await contacts.ReadAsync<Contact>();

            return items;
        }

        /// <summary>
        /// Get activities by customer ID
        /// </summary>
        /// <param name="customerId">The customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of activities associated with the customer</returns>
        public async Task<IEnumerable<Activity>> GetActivitiesByCustomerAsync(long customerId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT DISTINCT a.*
                FROM crm_activity a
                LEFT JOIN crm_deal d ON a.RelationType = 'deal' AND a.RelationId = d.Id
                LEFT JOIN crm_lead l ON a.RelationType = 'lead' AND a.RelationId = l.Id
                WHERE (d.CustomerId = @CustomerId OR l.CustomerId = @CustomerId)
                ORDER BY a.CreatedOn DESC";

            var activities = await Connection.QueryAsync<Activity>(
                sql, new { CustomerId = customerId }, Transaction);

            return activities;
        }

        /// <summary>
        /// Create new customer
        /// </summary>
        public async Task<long> CreateAsync(Customer customer, CancellationToken ct = default)
        {
            return await base.AddAsync(customer, ct);
        }

        /// <summary>
        /// Create new customer with an explicit Id (used for Dynamics CustAccount linkage)
        /// Returns the provided Id if the customer already exists.
        /// </summary>
        public async Task<long> CreateWithExplicitIdAsync(Customer customer, CancellationToken ct = default)
        {
            ArgumentNullException.ThrowIfNull(customer);

            if (customer.Id <= 0)
                throw new ArgumentException("Customer Id must be provided for explicit insert.", nameof(customer));

            // Avoid duplicate key errors if the customer is already present
            if (await ExistsAsync(customer.Id, ct))
                return customer.Id;

            // Ensure a transaction is active for consistency with other writes
            if (Transaction == null)
                throw new InvalidOperationException("CreateWithExplicitIdAsync requires an active transaction. Call _unitOfWork.BeginTransactionAsync() first.");

            const string sql = @"
                INSERT INTO crm_customer
                (Id, Name, Domain, Phone, Email, BillingAddress, ShippingAddress, Website, Type, OwnerId, VatNumber, Currency, Country, Industry, Notes, PaymentTerms, DeliveryTerms, ContactPerson, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy)
                VALUES
                (@Id, @Name, @Domain, @Phone, @Email, @BillingAddress, @ShippingAddress, @Website, @Type, @OwnerId, @VatNumber, @Currency, @Country, @Industry, @Notes, @PaymentTerms, @DeliveryTerms, @ContactPerson, @CreatedOn, @CreatedBy, @UpdatedOn, @UpdatedBy)";

            await Connection.ExecuteAsync(sql, customer, Transaction);

            return customer.Id;
        }

        /// <summary>
        /// Update existing customer
        /// </summary>
        public new async Task<bool> UpdateAsync(Customer customer, CancellationToken ct = default)
        {
            await base.UpdateAsync(customer, ct);
            return true;
        }

        /// <summary>
        /// Delete customer by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if customer exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var customer = await GetByIdAsync(id, ct);
            return customer != null;
        }

        /// <summary>
        /// Get customers by owner ID
        /// </summary>
        public async Task<IEnumerable<Customer>> GetByOwnerIdAsync(long ownerId, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Customer>(
                "SELECT * FROM crm_customer WHERE OwnerId = @OwnerId ORDER BY UpdatedOn DESC",
                new { OwnerId = ownerId },
                Transaction);
        }

        /// <summary>
        /// Get customers by domain
        /// </summary>
        public async Task<IEnumerable<Customer>> GetByDomainAsync(string domain, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Customer>(
                "SELECT * FROM crm_customer WHERE Domain = @Domain ORDER BY UpdatedOn DESC",
                new { Domain = domain },
                Transaction);
        }

        /// <summary>
        /// Get customers by type
        /// </summary>
        public async Task<IEnumerable<Customer>> GetByTypeAsync(string type, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Customer>(
                "SELECT * FROM crm_customer WHERE Type = @Type ORDER BY UpdatedOn DESC",
                new { Type = type },
                Transaction);
        }

        /// <summary>
        /// Get customers by email
        /// </summary>
        public async Task<IEnumerable<Customer>> GetByEmailAsync(string email, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Customer>(
                "SELECT * FROM crm_customer WHERE Email = @Email ORDER BY UpdatedOn DESC",
                new { Email = email },
                Transaction);
        }

        /// <summary>
        /// Get customers by name
        /// </summary>
        public async Task<IEnumerable<Customer>> GetByNameAsync(string name, CancellationToken ct = default)
        {
            return await Connection.QueryAsync<Customer>(
                "SELECT * FROM crm_customer WHERE Name = @Name ORDER BY UpdatedOn DESC",
                new { Name = name },
                Transaction);
        }

        /// <summary>
        /// Build WHERE clause from query parameters
        /// Build WHERE clause from query parameters using generic filter processing
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, CustomerQueryRequest query)
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
    }
}
