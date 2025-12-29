using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IContactService
    {
        Task<PagedResult<ContactResponse>> QueryAsync(ContactQueryRequest request, CancellationToken ct = default);
        Task<ContactResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreateContactRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateContactRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
        Task<IEnumerable<DealResponse>> GetDealsByContactAsync(long contactId, CancellationToken ct = default);
        Task<IEnumerable<ActivityResponse>> GetActivitiesByContactAsync(long contactId, CancellationToken ct = default);
        Task<bool> SetAsPrimaryAsync(long id, CancellationToken ct = default);
    }
}
