using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IActivityAttachmentService
    {
        Task<PagedResult<ActivityAttachmentResponse>> QueryAsync(ActivityAttachmentQueryRequest request, CancellationToken ct = default);
        Task<ActivityAttachmentResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<IEnumerable<ActivityAttachmentResponse>> GetByActivityAsync(long activityId, CancellationToken ct = default);
        Task<long> CreateAsync(CreateActivityAttachmentRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateActivityAttachmentRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
    }
}

