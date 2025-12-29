using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    public class GoalProgressHistoryRepository : DapperRepository<GoalProgressHistory, long>, IGoalProgressHistoryRepository
    {
        public GoalProgressHistoryRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        public async Task<long> CreateAsync(GoalProgressHistory history, CancellationToken ct = default)
        {
            return await base.AddAsync(history, ct);
        }

        public new async Task<GoalProgressHistory?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM crm_goal_progress_history WHERE Id = @Id";
            return await Connection.QuerySingleOrDefaultAsync<GoalProgressHistory>(sql, new { Id = id }, Transaction);
        }

        public async Task<IEnumerable<GoalProgressHistory>> GetByGoalIdAsync(long goalId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_progress_history
                WHERE GoalId = @GoalId
                ORDER BY SnapshotTimestamp DESC";

            return await Connection.QueryAsync<GoalProgressHistory>(sql, new { GoalId = goalId }, Transaction);
        }

        public async Task<IEnumerable<GoalProgressHistory>> GetByGoalIdAsync(long goalId, int limit, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_progress_history
                WHERE GoalId = @GoalId
                ORDER BY SnapshotTimestamp DESC
                LIMIT @Limit";

            return await Connection.QueryAsync<GoalProgressHistory>(sql, new { GoalId = goalId, Limit = limit }, Transaction);
        }

        public async Task<GoalProgressHistory?> GetLatestForGoalAsync(long goalId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_progress_history
                WHERE GoalId = @GoalId
                ORDER BY SnapshotTimestamp DESC
                LIMIT 1";

            return await Connection.QuerySingleOrDefaultAsync<GoalProgressHistory>(sql, new { GoalId = goalId }, Transaction);
        }

        public async Task<IEnumerable<GoalProgressHistory>> GetByDateRangeAsync(long goalId, DateTime startDate, DateTime endDate, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_progress_history
                WHERE GoalId = @GoalId
                AND SnapshotTimestamp >= @StartDate
                AND SnapshotTimestamp <= @EndDate
                ORDER BY SnapshotTimestamp ASC";

            return await Connection.QueryAsync<GoalProgressHistory>(sql, new { GoalId = goalId, StartDate = startDate, EndDate = endDate }, Transaction);
        }

        public async Task<IEnumerable<GoalProgressHistory>> GetBySnapshotSourceAsync(long goalId, string snapshotSource, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_progress_history
                WHERE GoalId = @GoalId
                AND SnapshotSource = @SnapshotSource
                ORDER BY SnapshotTimestamp DESC";

            return await Connection.QueryAsync<GoalProgressHistory>(sql, new { GoalId = goalId, SnapshotSource = snapshotSource }, Transaction);
        }

        public async Task<int> GetCountByGoalIdAsync(long goalId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT COUNT(1) FROM crm_goal_progress_history
                WHERE GoalId = @GoalId";

            return await Connection.ExecuteScalarAsync<int>(sql, new { GoalId = goalId }, Transaction);
        }
    }
}
