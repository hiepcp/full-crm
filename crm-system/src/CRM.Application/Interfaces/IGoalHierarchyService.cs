using CRMSys.Application.Dtos.Response;
using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces
{
    /// <summary>
    /// Service for managing goal hierarchy (parent-child relationships) and progress roll-up
    /// Supports OKR-style cascading goals: Company → Team → Individual
    /// </summary>
    public interface IGoalHierarchyService
    {
        /// <summary>
        /// Link a goal to a parent goal with validation
        /// Validates: no circular dependencies, max depth (3 levels), compatible owner types
        /// </summary>
        /// <param name="childGoalId">Goal to link as child</param>
        /// <param name="parentGoalId">Parent goal ID</param>
        /// <param name="userEmail">User performing the action</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Updated child goal</returns>
        Task<GoalResponse?> LinkToParentAsync(long childGoalId, long parentGoalId, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Unlink a goal from its parent (orphan the goal)
        /// </summary>
        /// <param name="childGoalId">Goal to unlink</param>
        /// <param name="userEmail">User performing the action</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Updated child goal</returns>
        Task<GoalResponse?> UnlinkFromParentAsync(long childGoalId, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Get full hierarchy tree for a goal (ancestors + descendants)
        /// </summary>
        /// <param name="goalId">Goal ID to get hierarchy for</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Goal with ancestors and descendants populated</returns>
        Task<GoalHierarchyResponse?> GetHierarchyAsync(long goalId, CancellationToken ct = default);

        /// <summary>
        /// Get direct children of a goal
        /// </summary>
        /// <param name="parentGoalId">Parent goal ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of child goals</returns>
        Task<IEnumerable<GoalResponse>> GetChildrenAsync(long parentGoalId, CancellationToken ct = default);

        /// <summary>
        /// Recalculate parent goal progress by aggregating all children progress
        /// Recursively updates grandparents up the chain
        /// </summary>
        /// <param name="goalId">Goal whose parent(s) should be recalculated</param>
        /// <param name="ct">Cancellation token</param>
        Task RecalculateParentProgressAsync(long goalId, CancellationToken ct = default);

        /// <summary>
        /// Validate that linking child to parent doesn't create a circular dependency
        /// </summary>
        /// <param name="childGoalId">Proposed child goal ID</param>
        /// <param name="parentGoalId">Proposed parent goal ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Validation result with error message if invalid</returns>
        Task<(bool IsValid, string? ErrorMessage)> ValidateHierarchyLinkAsync(long childGoalId, long parentGoalId, CancellationToken ct = default);

        /// <summary>
        /// Validate that the hierarchy depth doesn't exceed max (3 levels)
        /// </summary>
        /// <param name="parentGoalId">Parent goal ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Validation result with error message if invalid</returns>
        Task<(bool IsValid, string? ErrorMessage)> ValidateMaxDepthAsync(long parentGoalId, CancellationToken ct = default);

        /// <summary>
        /// Validate that owner types are compatible (company can have team/individual, team can have individual)
        /// </summary>
        /// <param name="childGoal">Child goal</param>
        /// <param name="parentGoal">Parent goal</param>
        /// <returns>Validation result with error message if invalid</returns>
        (bool IsValid, string? ErrorMessage) ValidateCompatibleOwnerTypes(Goal childGoal, Goal parentGoal);
    }
}
