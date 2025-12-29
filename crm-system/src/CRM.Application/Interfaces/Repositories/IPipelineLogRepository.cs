using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for PipelineLog entity operations
    /// </summary>
    public interface IPipelineLogRepository
    {
        /// <summary>
        /// Query pipeline logs with advanced filtering, pagination, ordering and field selection
        /// </summary>
        Task<PagedResult<PipelineLog>> QueryAsync(PipelineLogQueryRequest query, CancellationToken ct = default);

        /// <summary>
        /// Get pipeline log by ID
        /// </summary>
        Task<PipelineLog?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new pipeline log
        /// </summary>
        Task<long> CreateAsync(PipelineLog pipelineLog, CancellationToken ct = default);

        /// <summary>
        /// Update existing pipeline log
        /// </summary>
        Task<bool> UpdateAsync(PipelineLog pipelineLog, CancellationToken ct = default);

        /// <summary>
        /// Delete pipeline log by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Check if pipeline log exists by ID
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get pipeline logs by deal ID
        /// </summary>
        Task<IEnumerable<PipelineLog>> GetByDealIdAsync(long dealId, CancellationToken ct = default);

        /// <summary>
        /// Get pipeline logs by stage
        /// </summary>
        Task<IEnumerable<PipelineLog>> GetByStageAsync(string stage, CancellationToken ct = default);
    }
}
