using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Repository implementation for LeadScoreRule using Dapper - simplified single-table design
    /// </summary>
    public class LeadScoreRuleRepository : DapperRepository<LeadScoreRule, long>, ILeadScoreRuleRepository
    {
        public LeadScoreRuleRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Get all rules (excluding soft-deleted)
        /// </summary>
        public override async Task<IEnumerable<LeadScoreRule>> GetAllAsync(CancellationToken ct = default)
        {
            const string sql = @"
                SELECT Id, RuleName, Description, FieldName, Score,
                       IsActive, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
                FROM crm_lead_score_rule
                WHERE DeletedAt IS NULL
                ORDER BY RuleName";
            
            return await Connection.QueryAsync<LeadScoreRule>(sql, transaction: Transaction);
        }

        /// <summary>
        /// Get only active rules (IsActive=1 and DeletedAt IS NULL)
        /// </summary>
        public async Task<IEnumerable<LeadScoreRule>> GetActiveAsync(CancellationToken ct = default)
        {
            const string sql = @"
                SELECT Id, RuleName, Description, FieldName, Score,
                       IsActive, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
                FROM crm_lead_score_rule
                WHERE IsActive = 1 AND DeletedAt IS NULL
                ORDER BY RuleName";
            
            return await Connection.QueryAsync<LeadScoreRule>(sql, transaction: Transaction);
        }

        /// <summary>
        /// Get rule by ID
        /// </summary>
        public override async Task<LeadScoreRule?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT Id, RuleName, Description, FieldName, Score,
                       IsActive, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
                FROM crm_lead_score_rule
                WHERE Id = @Id AND DeletedAt IS NULL";
            
            return await Connection.QueryFirstOrDefaultAsync<LeadScoreRule>(
                sql, 
                new { Id = id }, 
                transaction: Transaction);
        }

        /// <summary>
        /// Get rule by field name (for uniqueness check)
        /// </summary>
        public async Task<LeadScoreRule?> GetByFieldNameAsync(string fieldName, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT Id, RuleName, Description, FieldName, Score,
                       IsActive, CreatedOn, CreatedBy, UpdatedOn, UpdatedBy
                FROM crm_lead_score_rule
                WHERE FieldName = @FieldName AND DeletedAt IS NULL";
            
            return await Connection.QueryFirstOrDefaultAsync<LeadScoreRule>(
                sql, 
                new { FieldName = fieldName }, 
                transaction: Transaction);
        }

        /// <summary>
        /// Create new rule
        /// </summary>
        public async Task<long> CreateAsync(LeadScoreRule rule, CancellationToken ct = default)
        {
            const string sql = @"
                INSERT INTO crm_lead_score_rule 
                (RuleName, Description, FieldName, Score, IsActive, 
                 CreatedOn, CreatedBy, UpdatedOn, UpdatedBy)
                VALUES 
                (@RuleName, @Description, @FieldName, @Score, @IsActive, 
                 @CreatedOn, @CreatedBy, @UpdatedOn, @UpdatedBy);
                SELECT LAST_INSERT_ID();";

            return await Connection.ExecuteScalarAsync<long>(sql, rule, transaction: Transaction);
        }

        /// <summary>
        /// Update existing rule
        /// </summary>
        public override async Task<bool> UpdateAsync(LeadScoreRule rule, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE crm_lead_score_rule
                SET RuleName = @RuleName,
                    Description = @Description,
                    FieldName = @FieldName,
                    Score = @Score,
                    IsActive = @IsActive,
                    UpdatedOn = @UpdatedOn,
                    UpdatedBy = @UpdatedBy
                WHERE Id = @Id AND DeletedAt IS NULL";

            var rowsAffected = await Connection.ExecuteAsync(sql, rule, transaction: Transaction);
            return rowsAffected > 0;
        }

        /// <summary>
        /// Delete rule (soft delete using DeletedAt)
        /// </summary>
        public override async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE crm_lead_score_rule 
                SET DeletedAt = @DeletedAt 
                WHERE Id = @Id AND DeletedAt IS NULL";
            
            var rowsAffected = await Connection.ExecuteAsync(
                sql, 
                new { Id = id, DeletedAt = DateTime.UtcNow }, 
                transaction: Transaction);
            
            return rowsAffected > 0;
        }

        /// <summary>
        /// Check if rule exists
        /// </summary>
        public async Task<bool> ExistsAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT COUNT(1) FROM crm_lead_score_rule WHERE Id = @Id AND DeletedAt IS NULL";
            var count = await Connection.ExecuteScalarAsync<int>(sql, new { Id = id }, transaction: Transaction);
            return count > 0;
        }
    }
}
