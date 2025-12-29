using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IPipelineLogService
    {
        Task<PagedResult<PipelineLogResponse>> QueryAsync(PipelineLogQueryRequest request, CancellationToken ct = default);
        Task<PipelineLogResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreatePipelineLogRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdatePipelineLogRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
        Task<IEnumerable<PipelineLogResponse>> GetByDealIdAsync(long dealId, CancellationToken ct = default);
        Task<IEnumerable<PipelineLogResponse>> GetByStageAsync(string stage, CancellationToken ct = default);

        /// <summary>
        /// Log a stage change for a deal
        /// </summary>
        Task LogStageChangeAsync(long dealId, string? oldStage, string newStage, string? changedBy = null, string? notes = null, CancellationToken ct = default);
    }
}
