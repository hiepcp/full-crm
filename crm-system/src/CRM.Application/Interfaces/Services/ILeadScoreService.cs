using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service interface for lead score rule management and calculation
    /// Simplified single-table design with reflection-based field checking
    /// </summary>
    public interface ILeadScoreService
    {
        /// <summary>
        /// Get all lead score rules (including inactive)
        /// </summary>
        Task<IEnumerable<LeadScoreRuleResponse>> GetAllRulesAsync(CancellationToken ct = default);

        /// <summary>
        /// Get only active lead score rules (IsActive=1 and DeletedAt IS NULL)
        /// </summary>
        Task<IEnumerable<LeadScoreRuleResponse>> GetActiveRulesAsync(CancellationToken ct = default);

        /// <summary>
        /// Get lead score rule by ID
        /// </summary>
        Task<LeadScoreRuleResponse?> GetRuleByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create new lead score rule
        /// </summary>
        /// <exception cref="InvalidOperationException">Thrown if rule with same FieldName already exists</exception>
        Task<LeadScoreRuleResponse> CreateRuleAsync(CreateLeadScoreRuleRequest request, string createdBy, CancellationToken ct = default);

        /// <summary>
        /// Update existing lead score rule
        /// </summary>
        /// <exception cref="KeyNotFoundException">Thrown if rule with given ID not found</exception>
        /// <exception cref="InvalidOperationException">Thrown if updating FieldName to one that already exists</exception>
        Task<LeadScoreRuleResponse> UpdateRuleAsync(long id, UpdateLeadScoreRuleRequest request, string updatedBy, CancellationToken ct = default);

        /// <summary>
        /// Delete lead score rule (soft delete using DeletedAt)
        /// </summary>
        /// <returns>True if deleted, false if not found</returns>
        Task<bool> DeleteRuleAsync(long id, CancellationToken ct = default);
    }
}
