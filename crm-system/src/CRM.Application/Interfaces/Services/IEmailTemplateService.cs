using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Email Template service interface
    /// </summary>
    public interface IEmailTemplateService
    {
        /// <summary>
        /// Get available templates for user
        /// </summary>
        Task<IEnumerable<EmailTemplateResponse>> GetAvailableTemplatesAsync(string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Get template by ID
        /// </summary>
        Task<EmailTemplateResponse?> GetByIdAsync(long id, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Create new template
        /// </summary>
        Task<long> CreateAsync(CreateEmailTemplateRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Update template
        /// </summary>
        Task<bool> UpdateAsync(long id, UpdateEmailTemplateRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Delete template
        /// </summary>
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Search templates
        /// </summary>
        Task<IEnumerable<EmailTemplateResponse>> SearchAsync(string userEmail, string keyword, string? category = null, CancellationToken ct = default);

        /// <summary>
        /// Get templates by category
        /// </summary>
        Task<IEnumerable<EmailTemplateResponse>> GetByCategoryAsync(string userEmail, string category, CancellationToken ct = default);

        /// <summary>
        /// Get user's own templates
        /// </summary>
        Task<IEnumerable<EmailTemplateResponse>> GetUserTemplatesAsync(string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Get shared templates
        /// </summary>
        Task<IEnumerable<EmailTemplateResponse>> GetSharedTemplatesAsync(string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Render template with variable replacement
        /// </summary>
        Task<RenderedEmailTemplateResponse> RenderTemplateAsync(RenderEmailTemplateRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Use template (send email)
        /// </summary>
        Task<bool> UseTemplateAsync(UseEmailTemplateRequest request, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Get all available variables
        /// </summary>
        Task<IEnumerable<GroupedVariablesResponse>> GetAvailableVariablesAsync(CancellationToken ct = default);
    }
}
