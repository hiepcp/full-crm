using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    public interface IGoalRepository
    {
        Task<PagedResult<Goal>> QueryAsync(GoalQueryRequest query, CancellationToken ct = default);
        Task<Goal?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(Goal goal, CancellationToken ct = default);
        Task<bool> UpdateAsync(Goal goal, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);
        Task<IEnumerable<GoalMetricsResponse>> GetMetricsAsync(GoalMetricsRequest request, CancellationToken ct = default);

        // === New: Hierarchy Support ===
        Task<IEnumerable<Goal>> GetChildrenAsync(long parentGoalId, CancellationToken ct = default);
        Task<IEnumerable<Goal>> GetDescendantsAsync(long rootGoalId, CancellationToken ct = default);
        Task<IEnumerable<Goal>> GetAncestorsAsync(long childGoalId, CancellationToken ct = default);

        // === New: Auto-Calculation Support ===
        Task<IEnumerable<Goal>> GetAutoCalculatedGoalsAsync(CancellationToken ct = default);
        Task<IEnumerable<Goal>> GetFailedCalculationGoalsAsync(CancellationToken ct = default);
    }
}



