using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IDealQuotationService
    {
        Task<PagedResult<DealQuotationResponse>> QueryAsync(DealQuotationQueryRequest request, CancellationToken ct = default);
        Task<DealQuotationResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreateDealQuotationRequest request, string userEmail, CancellationToken ct = default);
        Task<IEnumerable<long>> BulkCreateAsync(IEnumerable<CreateDealQuotationRequest> requests, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateDealQuotationRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
        Task<IEnumerable<DealQuotationResponse>> GetByDealIdAsync(long dealId, CancellationToken ct = default);
        Task<IEnumerable<DealQuotationResponse>> GetByQuotationNumberAsync(string quotationNumber, CancellationToken ct = default);
        Task<int> DeleteByDealIdAsync(long dealId, string userEmail, CancellationToken ct = default);
        Task<IEnumerable<DealQuotationWithDynamicsDataResponse>> GetQuotationsWithDynamicsDataByDealIdAsync(long dealId, CancellationToken ct = default);
    }
}
