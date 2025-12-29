using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for LeadScoreRule operations - simplified single-table design
    /// </summary>
    public interface ILeadScoreRuleRepository
    {
        /// <summary>
        /// Get all rules (excluding soft-deleted)
        /// </summary>
        Task<IEnumerable<LeadScoreRule>> GetAllAsync(CancellationToken ct = default);

        /// <summary>
        /// Get only active rules (IsActive=1 and DeletedAt IS NULL)
        /// </summary>
        Task<IEnumerable<LeadScoreRule>> GetActiveAsync(CancellationToken ct = default);

        /// <summary>
        /// Get rule by ID
        /// </summary>
        Task<LeadScoreRule?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get rule by field name (for uniqueness check)
        /// </summary>
        Task<LeadScoreRule?> GetByFieldNameAsync(string fieldName, CancellationToken ct = default);

        /// <summary>
        /// Create new rule
        /// </summary>
        Task<long> CreateAsync(LeadScoreRule rule, CancellationToken ct = default);
        
        /// <summary>
        /// Update existing rule
        /// </summary>
        Task<bool> UpdateAsync(LeadScoreRule rule, CancellationToken ct = default);
        
        /// <summary>
        /// Delete rule (soft delete using DeletedAt)
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);
        
        /// <summary>
        /// Check if rule exists
        /// </summary>
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);
    }
}
