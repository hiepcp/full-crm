using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface ICustomerService
    {
        Task<PagedResult<CustomerResponse>> QueryAsync(CustomerQueryRequest request, CancellationToken ct = default);
        Task<IEnumerable<DealResponse?>?> GetDealsByCustomerAsync(long customerId, CancellationToken ct = default);
        Task<IEnumerable<LeadResponse?>> GetLeadsByCustomerAsync(long customerId, CancellationToken ct = default);
        Task<IEnumerable<ContactResponse?>> GetContactsByCustomerAsync(long customerId, CancellationToken ct = default);
        Task<IEnumerable<ActivityResponse?>> GetActivitiesByCustomerAsync(long customerId, CancellationToken ct = default);
        Task<CustomerResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreateCustomerRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateCustomerRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
    }
}
