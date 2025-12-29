using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    public interface IActivityParticipantRepository
    {
        Task<PagedResult<ActivityParticipant>> QueryAsync(ActivityParticipantQueryRequest query, CancellationToken ct = default);
        Task<ActivityParticipant?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(ActivityParticipant participant, CancellationToken ct = default);
        Task<bool> UpdateAsync(ActivityParticipant participant, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        Task<IEnumerable<ActivityParticipant>> GetByActivityIdAsync(long activityId, CancellationToken ct = default);
    }
}

