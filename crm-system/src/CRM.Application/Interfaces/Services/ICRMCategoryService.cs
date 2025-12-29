using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface ICRMCategoryService : IBaseService<CRMCategory, long, CRMCategoryRequestDto>
    {
        // Thêm nghiệp vụ riêng (nếu có)
        Task<string?> GetCategoryPathAsync(long value, CancellationToken ct);
        new Task<PagedResult<CRMCategoryResponseDto>> GetPagedAsync(PagedRequest request, CancellationToken ct = default);
    }
}
