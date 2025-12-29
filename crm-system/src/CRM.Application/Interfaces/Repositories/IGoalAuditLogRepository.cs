using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    public interface IGoalAuditLogRepository
    {
        Task<long> CreateAsync(GoalAuditLog auditLog, CancellationToken ct = default);
        Task<IEnumerable<GoalAuditLog>> GetByGoalIdAsync(long goalId, CancellationToken ct = default);
        Task<IEnumerable<GoalAuditLog>> GetByGoalIdAsync(long goalId, int limit, CancellationToken ct = default);
        Task<IEnumerable<GoalAuditLog>> GetByEventTypeAsync(long goalId, string eventType, CancellationToken ct = default);
        Task<IEnumerable<GoalAuditLog>> GetByUserAsync(long userId, CancellationToken ct = default);
        Task<IEnumerable<GoalAuditLog>> GetByDateRangeAsync(long goalId, DateTime startDate, DateTime endDate, CancellationToken ct = default);
        Task<IEnumerable<GoalAuditLog>> GetSystemEventsAsync(long goalId, CancellationToken ct = default);
        Task<IEnumerable<GoalAuditLog>> GetUserEventsAsync(long goalId, CancellationToken ct = default);
    }
}
