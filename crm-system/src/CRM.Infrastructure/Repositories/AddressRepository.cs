using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Address repository implementation using Dapper
    /// Queries both crm_lead_address and crm_customer_address tables
    /// </summary>
    public class AddressRepository : DapperRepository<LeadAddress, long>, IAddressRepository
    {
        public AddressRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Get addresses by relation (queries both lead and customer address tables)
        /// </summary>
        public async Task<IEnumerable<AddressResponse>> GetByRelationAsync(string relationType, long relationId, CancellationToken ct = default)
        {
            string sql;

            if (relationType.ToLower() == "lead")
            {
                sql = @"
                    SELECT 
                        Id,
                        'lead' as RelationType,
                        LeadId as RelationId,
                        AddressType,
                        CompanyName,
                        AddressLine,
                        Postcode,
                        City,
                        Country,
                        ContactPerson,
                        Email,
                        TelephoneNo,
                        PortOfDestination,
                        IsPrimary,
                        CreatedOn,
                        CreatedBy,
                        UpdatedOn,
                        UpdatedBy
                    FROM crm_lead_address
                    WHERE LeadId = @RelationId
                    ORDER BY IsPrimary DESC, AddressType";
            }
            else if (relationType.ToLower() == "customer")
            {
                sql = @"
                    SELECT 
                        Id,
                        'customer' as RelationType,
                        CustomerId as RelationId,
                        AddressType,
                        CompanyName,
                        AddressLine,
                        Postcode,
                        City,
                        Country,
                        ContactPerson,
                        Email,
                        TelephoneNo,
                        PortOfDestination,
                        IsPrimary,
                        CreatedOn,
                        CreatedBy,
                        UpdatedOn,
                        UpdatedBy
                    FROM crm_customer_address
                    WHERE CustomerId = @RelationId
                    ORDER BY IsPrimary DESC, AddressType";
            }
            else
            {
                // Return empty if relation type is not supported
                return Enumerable.Empty<AddressResponse>();
            }

            return await Connection.QueryAsync<AddressResponse>(sql,
                new { RelationId = relationId },
                Transaction);
        }
    }
}
