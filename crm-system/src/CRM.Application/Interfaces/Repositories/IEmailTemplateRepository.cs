using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for EmailTemplate entity operations
    /// </summary>
    public interface IEmailTemplateRepository
    {
        /// <summary>
        /// Get available templates for a specific user (owned + shared)
        /// </summary>
        Task<IEnumerable<EmailTemplate>> GetAvailableTemplatesForUserAsync(string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Get template by ID
        /// </summary>
        Task<EmailTemplate?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Create template
        /// </summary>
        Task<long> CreateAsync(EmailTemplate template, CancellationToken ct = default);

        /// <summary>
        /// Update template
        /// </summary>
        Task<bool> UpdateAsync(EmailTemplate template, CancellationToken ct = default);

        /// <summary>
        /// Soft delete template
        /// </summary>
        Task<bool> SoftDeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Mark template as used
        /// </summary>
        Task MarkAsUsedAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Search templates by keyword
        /// </summary>
        Task<IEnumerable<EmailTemplate>> SearchAsync(string userEmail, string keyword, string? category = null, CancellationToken ct = default);

        /// <summary>
        /// Get templates by category
        /// </summary>
        Task<IEnumerable<EmailTemplate>> GetByCategoryAsync(string userEmail, string category, CancellationToken ct = default);

        /// <summary>
        /// Get user's own templates
        /// </summary>
        Task<IEnumerable<EmailTemplate>> GetUserTemplatesAsync(string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Get shared templates (not owned by user)
        /// </summary>
        Task<IEnumerable<EmailTemplate>> GetSharedTemplatesAsync(string userEmail, CancellationToken ct = default);
    }
}
