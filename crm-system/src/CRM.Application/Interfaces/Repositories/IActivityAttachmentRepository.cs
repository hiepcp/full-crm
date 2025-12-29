using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    public interface IActivityAttachmentRepository
    {
        Task<PagedResult<ActivityAttachment>> QueryAsync(ActivityAttachmentQueryRequest query, CancellationToken ct = default);
        Task<ActivityAttachment?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(ActivityAttachment entity, CancellationToken ct = default);
        Task<bool> UpdateAsync(ActivityAttachment entity, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        Task<IEnumerable<ActivityAttachment>> GetByActivityAsync(long activityId, CancellationToken ct = default);
    }
}

