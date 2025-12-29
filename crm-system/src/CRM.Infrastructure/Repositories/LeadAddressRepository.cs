using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Lead address repository implementation using Dapper
    /// </summary>
    public class LeadAddressRepository : ILeadAddressRepository
    {
        private readonly IUnitOfWork _unitOfWork;

        public LeadAddressRepository(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        protected System.Data.IDbConnection Connection => _unitOfWork.Connection;
        protected System.Data.IDbTransaction? Transaction => _unitOfWork.Transaction;

        public async Task<IEnumerable<LeadAddress>> GetByLeadIdAsync(long leadId, CancellationToken ct = default)
        {
            var sql = "SELECT * FROM crm_lead_address WHERE LeadId = @LeadId";
            return await Connection.QueryAsync<LeadAddress>(sql, new { LeadId = leadId }, Transaction);
        }

        public async Task BulkInsertAsync(IEnumerable<LeadAddress> addresses, CancellationToken ct = default)
        {
            var sql = @"
                INSERT INTO crm_lead_address
                (LeadId, AddressType, CompanyName, AddressLine, Postcode, City, Country,
                 ContactPerson, Email, TelephoneNo, PortOfDestination, IsPrimary,
                 CreatedOn, CreatedBy, UpdatedOn, UpdatedBy)
                VALUES
                (@LeadId, @AddressType, @CompanyName, @AddressLine, @Postcode, @City, @Country,
                 @ContactPerson, @Email, @TelephoneNo, @PortOfDestination, @IsPrimary,
                 @CreatedOn, @CreatedBy, @UpdatedOn, @UpdatedBy)";

            await Connection.ExecuteAsync(sql, addresses, Transaction);
        }

        public async Task<long> CreateAsync(LeadAddress address, CancellationToken ct = default)
        {
            var sql = @"
                INSERT INTO crm_lead_address
                (LeadId, AddressType, CompanyName, AddressLine, Postcode, City, Country,
                 ContactPerson, Email, TelephoneNo, PortOfDestination, IsPrimary,
                 CreatedOn, CreatedBy, UpdatedOn, UpdatedBy)
                VALUES
                (@LeadId, @AddressType, @CompanyName, @AddressLine, @Postcode, @City, @Country,
                 @ContactPerson, @Email, @TelephoneNo, @PortOfDestination, @IsPrimary,
                 @CreatedOn, @CreatedBy, @UpdatedOn, @UpdatedBy);
                SELECT LAST_INSERT_ID();";

            return await Connection.ExecuteScalarAsync<long>(sql, address, Transaction);
        }

        public async Task UpdateAsync(LeadAddress address, CancellationToken ct = default)
        {
            var sql = @"
                UPDATE crm_lead_address SET
                    AddressType = @AddressType,
                    CompanyName = @CompanyName,
                    AddressLine = @AddressLine,
                    Postcode = @Postcode,
                    City = @City,
                    Country = @Country,
                    ContactPerson = @ContactPerson,
                    Email = @Email,
                    TelephoneNo = @TelephoneNo,
                    PortOfDestination = @PortOfDestination,
                    IsPrimary = @IsPrimary,
                    UpdatedOn = @UpdatedOn,
                    UpdatedBy = @UpdatedBy
                WHERE Id = @Id";

            await Connection.ExecuteAsync(sql, address, Transaction);
        }

        public async Task BulkUpdateAsync(IEnumerable<LeadAddress> addresses, CancellationToken ct = default)
        {
            foreach (var address in addresses)
            {
                await UpdateAsync(address, ct);
            }
        }

        public async Task DeleteByIdsAsync(IEnumerable<long> ids, CancellationToken ct = default)
        {
            var sql = "DELETE FROM crm_lead_address WHERE Id IN @Ids";
            await Connection.ExecuteAsync(sql, new { Ids = ids }, Transaction);
        }
    }
}

