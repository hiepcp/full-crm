using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IGoalService
    {
        Task<PagedResult<GoalResponse>> QueryAsync(GoalQueryRequest request, CancellationToken ct = default);
        Task<GoalResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreateGoalRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateGoalRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);

        // === Business Logic Methods ===
        Task<bool> UpdateProgressAsync(long id, decimal progress, string userEmail, CancellationToken ct = default);
        Task<bool> ChangeStatusAsync(long id, string status, string userEmail, CancellationToken ct = default);
        Task<bool> CompleteGoalAsync(long id, string userEmail, CancellationToken ct = default);
        Task<bool> CancelGoalAsync(long id, string userEmail, CancellationToken ct = default);

        // === Auto-Calculation Support (US1) ===
        Task<GoalResponse?> ManualAdjustProgressAsync(long id, ManualProgressAdjustmentRequest request, string userEmail, CancellationToken ct = default);
        Task<GoalResponse?> RecalculateProgressAsync(long id, string userEmail, CancellationToken ct = default);
        Task<GoalForecastResponse?> GetForecastAsync(long id, CancellationToken ct = default);
        Task<IEnumerable<GoalProgressHistory>> GetProgressHistoryAsync(long id, CancellationToken ct = default);

        // === Analytics/Reporting ===
        Task<IEnumerable<GoalMetricsResponse>> GetMetricsAsync(GoalMetricsRequest request, CancellationToken ct = default);
        Task<Dictionary<string, int>> GetGoalsCountByStatusAsync(string? ownerType = null, CancellationToken ct = default);
        Task<Dictionary<string, decimal>> GetGoalsProgressByTypeAsync(string? ownerType = null, CancellationToken ct = default);
        Task<List<GoalResponse>> GetOverdueGoalsAsync(string? ownerType = null, CancellationToken ct = default);
        Task<List<GoalResponse>> GetTopPerformingGoalsAsync(int limit = 10, string? ownerType = null, CancellationToken ct = default);

        // === Goal Hierarchy Support (US4) ===
        Task<GoalResponse?> LinkToParentAsync(long childGoalId, LinkGoalToParentRequest request, string userEmail, CancellationToken ct = default);
        Task<GoalResponse?> UnlinkFromParentAsync(long childGoalId, string userEmail, CancellationToken ct = default);
        Task<GoalHierarchyResponse?> GetHierarchyAsync(long goalId, CancellationToken ct = default);
        Task<IEnumerable<GoalResponse>> GetChildrenAsync(long parentGoalId, CancellationToken ct = default);

        // === Analytics & Insights (US5) ===
        Task<GoalAnalyticsResponse> GetAnalyticsAsync(GoalQueryRequest request, CancellationToken ct = default);
    }
}