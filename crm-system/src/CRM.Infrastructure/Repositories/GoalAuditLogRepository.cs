using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    public class GoalAuditLogRepository : DapperRepository<GoalAuditLog, long>, IGoalAuditLogRepository
    {
        public GoalAuditLogRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        public async Task<long> CreateAsync(GoalAuditLog auditLog, CancellationToken ct = default)
        {
            return await base.AddAsync(auditLog, ct);
        }

        public async Task<IEnumerable<GoalAuditLog>> GetByGoalIdAsync(long goalId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_audit_log
                WHERE GoalId = @GoalId
                ORDER BY ChangedOn DESC";

            return await Connection.QueryAsync<GoalAuditLog>(sql, new { GoalId = goalId }, Transaction);
        }

        public async Task<IEnumerable<GoalAuditLog>> GetByGoalIdAsync(long goalId, int limit, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_audit_log
                WHERE GoalId = @GoalId
                ORDER BY ChangedOn DESC
                LIMIT @Limit";

            return await Connection.QueryAsync<GoalAuditLog>(sql, new { GoalId = goalId, Limit = limit }, Transaction);
        }

        public async Task<IEnumerable<GoalAuditLog>> GetByEventTypeAsync(long goalId, string eventType, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_audit_log
                WHERE GoalId = @GoalId
                AND EventType = @EventType
                ORDER BY ChangedOn DESC";

            return await Connection.QueryAsync<GoalAuditLog>(sql, new { GoalId = goalId, EventType = eventType }, Transaction);
        }

        public async Task<IEnumerable<GoalAuditLog>> GetByUserAsync(long userId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_audit_log
                WHERE ChangedBy = @UserId
                ORDER BY ChangedOn DESC";

            return await Connection.QueryAsync<GoalAuditLog>(sql, new { UserId = userId }, Transaction);
        }

        public async Task<IEnumerable<GoalAuditLog>> GetByDateRangeAsync(long goalId, DateTime startDate, DateTime endDate, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_audit_log
                WHERE GoalId = @GoalId
                AND ChangedOn >= @StartDate
                AND ChangedOn <= @EndDate
                ORDER BY ChangedOn DESC";

            return await Connection.QueryAsync<GoalAuditLog>(sql, new { GoalId = goalId, StartDate = startDate, EndDate = endDate }, Transaction);
        }

        public async Task<IEnumerable<GoalAuditLog>> GetSystemEventsAsync(long goalId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_audit_log
                WHERE GoalId = @GoalId
                AND ChangedBy IS NULL
                ORDER BY ChangedOn DESC";

            return await Connection.QueryAsync<GoalAuditLog>(sql, new { GoalId = goalId }, Transaction);
        }

        public async Task<IEnumerable<GoalAuditLog>> GetUserEventsAsync(long goalId, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_goal_audit_log
                WHERE GoalId = @GoalId
                AND ChangedBy IS NOT NULL
                ORDER BY ChangedOn DESC";

            return await Connection.QueryAsync<GoalAuditLog>(sql, new { GoalId = goalId }, Transaction);
        }
    }
}
