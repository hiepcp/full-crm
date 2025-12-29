using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces
{
    /// <summary>
    /// Service for automatically calculating goal progress from CRM data (deals, activities, revenue, tasks)
    /// </summary>
    public interface IGoalProgressCalculationService
    {
        /// <summary>
        /// Calculate progress for a specific goal based on its type
        /// </summary>
        Task<decimal> CalculateProgressAsync(long goalId, CancellationToken ct = default);

        /// <summary>
        /// Calculate revenue progress by summing closed deals within goal date range
        /// </summary>
        Task<decimal> CalculateRevenueProgressAsync(Goal goal, CancellationToken ct = default);

        /// <summary>
        /// Calculate deals progress by counting closed deals within goal date range
        /// </summary>
        Task<decimal> CalculateDealsProgressAsync(Goal goal, CancellationToken ct = default);

        /// <summary>
        /// Calculate activities progress by counting completed activities within goal date range
        /// </summary>
        Task<decimal> CalculateActivitiesProgressAsync(Goal goal, CancellationToken ct = default);

        /// <summary>
        /// Calculate tasks progress by counting completed tasks within goal date range
        /// </summary>
        Task<decimal> CalculateTasksProgressAsync(Goal goal, CancellationToken ct = default);

        /// <summary>
        /// Create a progress history snapshot if progress changed by >= 1%
        /// </summary>
        Task CreateSnapshotIfSignificantChangeAsync(Goal goal, decimal oldProgressPercentage, CancellationToken ct = default);

        /// <summary>
        /// Find and recalculate all goals affected by an entity change (deal closed, activity completed, etc.)
        /// </summary>
        Task RecalculateGoalsForEntityAsync(string entityType, long entityId, CancellationToken ct = default);

        /// <summary>
        /// Recalculate all auto-calculated goals (for scheduled job fallback)
        /// </summary>
        Task<int> RecalculateAllAutoCalculatedGoalsAsync(CancellationToken ct = default);
    }
}
