using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for EmailTemplateVariable entity operations
    /// </summary>
    public interface IEmailTemplateVariableRepository
    {
        /// <summary>
        /// Get all active variables
        /// </summary>
        Task<IEnumerable<EmailTemplateVariable>> GetAllActiveAsync(CancellationToken ct = default);

        /// <summary>
        /// Get variables by entity type
        /// </summary>
        Task<IEnumerable<EmailTemplateVariable>> GetByEntityTypeAsync(string entityType, CancellationToken ct = default);

        /// <summary>
        /// Get variable by key
        /// </summary>
        Task<EmailTemplateVariable?> GetByKeyAsync(string variableKey, CancellationToken ct = default);

        /// <summary>
        /// Get variables grouped by entity type
        /// </summary>
        Task<Dictionary<string, IEnumerable<EmailTemplateVariable>>> GetGroupedByEntityTypeAsync(CancellationToken ct = default);
    }
}
