using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Domain.Dynamics;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IAllCRMService
    {        
        // Generic version - biết type trước
        Task<PagedResult<T>> GetDataAsync<T>(int refType, PagedRequest request, CancellationToken ct = default)
            where T : RSVNModelBase, new();

        // Non-generic version - dynamic type
        Task<object> GetDataAsync(int refType, PagedRequest request, CancellationToken ct = default);

        // Get by modal name
        Task<object> GetDataByModalAsync(string modalName, PagedRequest request, CancellationToken ct = default);

        // Helper methods
        Task<Dictionary<string, string>> GetFilterableFields(int refType);
        Task<bool> ValidateFilterRequest(int refType, List<FilterRequest>? filters);
    }
}
