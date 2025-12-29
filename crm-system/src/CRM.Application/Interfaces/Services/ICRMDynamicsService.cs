using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface ICRMDynamicsService
    {
        Task<PagedResult<CRMDynReferenceResponseDto>> GetDynRefePagedAsync(int refeType, PagedRequest request, CancellationToken ct = default);

        /// <summary>
        /// Import a prospect into Dynamics and return the generated CustAccount
        /// </summary>
        Task<long> ImportProspectAsync(string name, string salesManager, string country, string phone, string email, CancellationToken ct = default);
    }
}
