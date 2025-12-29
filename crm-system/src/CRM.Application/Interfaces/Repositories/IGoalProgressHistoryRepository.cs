using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    public interface IGoalProgressHistoryRepository
    {
        Task<long> CreateAsync(GoalProgressHistory history, CancellationToken ct = default);
        Task<GoalProgressHistory?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<IEnumerable<GoalProgressHistory>> GetByGoalIdAsync(long goalId, CancellationToken ct = default);
        Task<IEnumerable<GoalProgressHistory>> GetByGoalIdAsync(long goalId, int limit, CancellationToken ct = default);
        Task<GoalProgressHistory?> GetLatestForGoalAsync(long goalId, CancellationToken ct = default);
        Task<IEnumerable<GoalProgressHistory>> GetByDateRangeAsync(long goalId, DateTime startDate, DateTime endDate, CancellationToken ct = default);
        Task<IEnumerable<GoalProgressHistory>> GetBySnapshotSourceAsync(long goalId, string snapshotSource, CancellationToken ct = default);
        Task<int> GetCountByGoalIdAsync(long goalId, CancellationToken ct = default);
    }
}
