using CRMSys.Application.Constants;
using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IReferenceTypesService : IBaseService<ReferenceTypes, long, ReferenceTypesRequestDto>
    {
        Task<IEnumerable<EnumDto>> GetPagedAsync(PagedRequest request, CancellationToken ct = default);
    }
}
