using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IActivityParticipantService
    {
        Task<PagedResult<ActivityParticipantResponse>> QueryAsync(ActivityParticipantQueryRequest request, CancellationToken ct = default);
        Task<ActivityParticipantResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<IEnumerable<ActivityParticipantResponse>> GetByActivityIdAsync(long activityId, CancellationToken ct = default);
        Task<long> CreateAsync(CreateActivityParticipantRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateActivityParticipantRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
    }
}

