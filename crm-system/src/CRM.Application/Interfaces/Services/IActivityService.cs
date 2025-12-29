using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;
using Microsoft.AspNetCore.Http;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IActivityService
    {
        Task<PagedResult<ActivityResponse>> QueryAsync(ActivityQueryRequest request, CancellationToken ct = default);
        Task<ActivityResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreateActivityRequest request, string userEmail, CancellationToken ct = default);
        Task<long> CreateWithParticipantsAndAttachmentsAsync(CreateActivityWithParticipantsAndAttachmentsRequest request, List<IFormFile> files, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateActivityRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
    }
}
