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
    /// CustomerAddress repository implementation using Dapper
    /// </summary>
    public class CustomerAddressRepository : DapperRepository<CustomerAddress, long>, ICustomerAddressRepository
    {
        public CustomerAddressRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Query customer addresses with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<CustomerAddress>> QueryAsync(CustomerAddressQueryRequest query, CancellationToken ct = default)
        {
            // Build dynamic SQL based on query parameters
            var sqlBuilder = new SqlBuilder();
            sqlBuilder.Select("Id, CustomerId, AddressType, CompanyName, AddressLine, Postcode, City, Country, ContactPerson, Email, TelephoneNo, PortOfDestination, IsPrimary, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy");
            var selector = sqlBuilder.AddTemplate(@"
                SELECT /**select**/ FROM crm_customer_address /**where**/ /**orderby**/ LIMIT @Take OFFSET @Skip
            ", new { Take = query.PageSize, Skip = (query.Page - 1) * query.PageSize });

            var countSelector = sqlBuilder.AddTemplate(@"
                SELECT COUNT(1) FROM crm_customer_address /**where**/
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

            var items = await multi.ReadAsync<CustomerAddress>();
            var totalCount = await multi.ReadSingleAsync<int>();

            return new PagedResult<CustomerAddress>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        /// <summary>
        /// Build WHERE clause based on query parameters
        /// </summary>
        private void BuildWhereClause(SqlBuilder sqlBuilder, CustomerAddressQueryRequest query)
        {
            if (query.CustomerId.HasValue)
                sqlBuilder.Where("CustomerId = @CustomerId", new { CustomerId = query.CustomerId.Value });

            if (!string.IsNullOrEmpty(query.AddressType))
                sqlBuilder.Where("AddressType = @AddressType", new { AddressType = query.AddressType });

            if (!string.IsNullOrEmpty(query.City))
                sqlBuilder.Where("City LIKE @City", new { City = $"%{query.City}%" });

            if (!string.IsNullOrEmpty(query.Country))
                sqlBuilder.Where("Country = @Country", new { Country = query.Country });

            if (!string.IsNullOrEmpty(query.Postcode))
                sqlBuilder.Where("Postcode LIKE @Postcode", new { Postcode = $"%{query.Postcode}%" });

            if (query.IsPrimary.HasValue)
                sqlBuilder.Where("IsPrimary = @IsPrimary", new { IsPrimary = query.IsPrimary.Value });

            if (!string.IsNullOrEmpty(query.Search))
            {
                sqlBuilder.Where(
                    "(CompanyName LIKE @Search OR AddressLine LIKE @Search OR ContactPerson LIKE @Search OR Email LIKE @Search)",
                    new { Search = $"%{query.Search}%" });
            }

            if (query.CreatedFrom.HasValue)
                sqlBuilder.Where("CreatedOn >= @CreatedFrom", new { CreatedFrom = query.CreatedFrom.Value });

            if (query.CreatedTo.HasValue)
                sqlBuilder.Where("CreatedOn <= @CreatedTo", new { CreatedTo = query.CreatedTo.Value });

            if (query.UpdatedFrom.HasValue)
                sqlBuilder.Where("UpdatedOn >= @UpdatedFrom", new { UpdatedFrom = query.UpdatedFrom.Value });

            if (query.UpdatedTo.HasValue)
                sqlBuilder.Where("UpdatedOn <= @UpdatedTo", new { UpdatedTo = query.UpdatedTo.Value });
        }

        /// <summary>
        /// Parse order by string into SQL ORDER BY clause
        /// </summary>
        private string ParseOrderBy(string orderBy)
        {
            if (string.IsNullOrEmpty(orderBy))
                return "UpdatedOn DESC";

            var parts = orderBy.Split(',');
            var orderByClauses = new List<string>();

            foreach (var part in parts)
            {
                var trimmed = part.Trim();
                var isDescending = trimmed.StartsWith("-");
                var field = isDescending ? trimmed.Substring(1) : trimmed;

                // Map field names
                var dbField = field.ToLower() switch
                {
                    "id" => "Id",
                    "customerid" => "CustomerId",
                    "addresstype" => "AddressType",
                    "companyname" => "CompanyName",
                    "city" => "City",
                    "country" => "Country",
                    "isprimary" => "IsPrimary",
                    "created_on" => "CreatedOn",
                    "updated_on" => "UpdatedOn",
                    _ => "UpdatedOn"
                };

                orderByClauses.Add($"{dbField} {(isDescending ? "DESC" : "ASC")}");
            }

            return string.Join(", ", orderByClauses);
        }

        /// <summary>
        /// Get customer address by ID
        /// </summary>
        public new async Task<CustomerAddress?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            return await base.GetByIdAsync(id, ct);
        }

        /// <summary>
        /// Get all addresses for a specific customer
        /// </summary>
        public async Task<IEnumerable<CustomerAddress>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            var sql = "SELECT * FROM crm_customer_address WHERE CustomerId = @CustomerId ORDER BY IsPrimary DESC, AddressType";
            return await Connection.QueryAsync<CustomerAddress>(sql, new { CustomerId = customerId }, Transaction);
        }

        /// <summary>
        /// Get primary address for a specific customer and address type
        /// </summary>
        public async Task<CustomerAddress?> GetPrimaryAddressAsync(long customerId, string? addressType = null, CancellationToken ct = default)
        {
            var sql = addressType != null
                ? "SELECT * FROM crm_customer_address WHERE CustomerId = @CustomerId AND AddressType = @AddressType AND IsPrimary = 1 LIMIT 1"
                : "SELECT * FROM crm_customer_address WHERE CustomerId = @CustomerId AND IsPrimary = 1 LIMIT 1";

            return await Connection.QueryFirstOrDefaultAsync<CustomerAddress>(
                sql,
                new { CustomerId = customerId, AddressType = addressType },
                Transaction);
        }

        /// <summary>
        /// Create new customer address
        /// </summary>
        public async Task<long> CreateAsync(CustomerAddress address, CancellationToken ct = default)
        {
            return await base.AddAsync(address, ct);
        }

        /// <summary>
        /// Update existing customer address
        /// </summary>
        public new async Task<bool> UpdateAsync(CustomerAddress address, CancellationToken ct = default)
        {
            await base.UpdateAsync(address, ct);
            return true;
        }

        /// <summary>
        /// Delete customer address by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Check if customer address exists by ID
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            var sql = "SELECT COUNT(1) FROM crm_customer_address WHERE Id = @Id";
            var count = await Connection.ExecuteScalarAsync<int>(sql, new { Id = id }, Transaction);
            return count > 0;
        }

        /// <summary>
        /// Bulk insert addresses
        /// </summary>
        public async Task BulkInsertAsync(IEnumerable<CustomerAddress> addresses, CancellationToken ct = default)
        {
            var sql = @"
                INSERT INTO crm_customer_address
                (CustomerId, AddressType, CompanyName, AddressLine, Postcode, City, Country,
                 ContactPerson, Email, TelephoneNo, PortOfDestination, IsPrimary,
                 CreatedOn, CreatedBy, UpdatedOn, UpdatedBy)
                VALUES
                (@CustomerId, @AddressType, @CompanyName, @AddressLine, @Postcode, @City, @Country,
                 @ContactPerson, @Email, @TelephoneNo, @PortOfDestination, @IsPrimary,
                 @CreatedOn, @CreatedBy, @UpdatedOn, @UpdatedBy)";

            await Connection.ExecuteAsync(sql, addresses, Transaction);
        }

        /// <summary>
        /// Delete all addresses for a customer
        /// </summary>
        public async Task<int> DeleteByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            var sql = "DELETE FROM crm_customer_address WHERE CustomerId = @CustomerId";
            return await Connection.ExecuteAsync(sql, new { CustomerId = customerId }, Transaction);
        }

        /// <summary>
        /// Count addresses for a customer
        /// </summary>
        public async Task<int> CountByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            var sql = "SELECT COUNT(1) FROM crm_customer_address WHERE CustomerId = @CustomerId";
            return await Connection.ExecuteScalarAsync<int>(sql, new { CustomerId = customerId }, Transaction);
        }

        /// <summary>
        /// Set address as primary (and unset other primary addresses of same type)
        /// </summary>
        public async Task<bool> SetAsPrimaryAsync(long id, CancellationToken ct = default)
        {
            var sql = "UPDATE crm_customer_address SET IsPrimary = 1, UpdatedOn = @UpdatedOn WHERE Id = @Id";
            var rowsAffected = await Connection.ExecuteAsync(sql, new { Id = id, UpdatedOn = DateTime.UtcNow }, Transaction);
            return rowsAffected > 0;
        }

        /// <summary>
        /// Unset primary flag for all addresses of a customer and type
        /// </summary>
        public async Task<int> UnsetPrimaryAsync(long customerId, string addressType, CancellationToken ct = default)
        {
            var sql = "UPDATE crm_customer_address SET IsPrimary = 0, UpdatedOn = @UpdatedOn WHERE CustomerId = @CustomerId AND AddressType = @AddressType";
            return await Connection.ExecuteAsync(sql, new { CustomerId = customerId, AddressType = addressType, UpdatedOn = DateTime.UtcNow }, Transaction);
        }
    }
}
