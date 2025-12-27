using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Email Templates
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/email-templates")]
    public class EmailTemplateController : ControllerBase
    {
        private readonly IEmailTemplateService _templateService;

        /// <summary>
        /// Init EmailTemplateController
        /// </summary>
        /// <param name="templateService"></param>
        public EmailTemplateController(IEmailTemplateService templateService)
        {
            _templateService = templateService;
        }

        /// <summary>
        /// Get available templates for current user
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of available templates</returns>
        [HttpGet]
        public async Task<IActionResult> GetAvailableTemplates(CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var templates = await _templateService.GetAvailableTemplatesAsync(userEmail, ct);
                return Ok(ApiResponse<IEnumerable<EmailTemplateResponse>>.Ok(templates, "Templates retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting available templates");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get user's own templates
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of user's templates</returns>
        [HttpGet("my-templates")]
        public async Task<IActionResult> GetMyTemplates(CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var templates = await _templateService.GetUserTemplatesAsync(userEmail, ct);
                return Ok(ApiResponse<IEnumerable<EmailTemplateResponse>>.Ok(templates, "My templates retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting user templates");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get shared templates (not owned by current user)
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of shared templates</returns>
        [HttpGet("shared")]
        public async Task<IActionResult> GetSharedTemplates(CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var templates = await _templateService.GetSharedTemplatesAsync(userEmail, ct);
                return Ok(ApiResponse<IEnumerable<EmailTemplateResponse>>.Ok(templates, "Shared templates retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting shared templates");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Search templates by keyword
        /// </summary>
        /// <param name="keyword">Search keyword</param>
        /// <param name="category">Optional category filter</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of matching templates</returns>
        [HttpGet("search")]
        public async Task<IActionResult> SearchTemplates([FromQuery] string keyword, [FromQuery] string? category = null, CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var templates = await _templateService.SearchAsync(userEmail, keyword, category, ct);
                return Ok(ApiResponse<IEnumerable<EmailTemplateResponse>>.Ok(templates, "Search results retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error searching templates");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get templates by category
        /// </summary>
        /// <param name="category">Category name</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of templates in category</returns>
        [HttpGet("category/{category}")]
        public async Task<IActionResult> GetByCategory(string category, CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var templates = await _templateService.GetByCategoryAsync(userEmail, category, ct);
                return Ok(ApiResponse<IEnumerable<EmailTemplateResponse>>.Ok(templates, $"Templates in category '{category}' retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting templates by category");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get template by ID
        /// </summary>
        /// <param name="id">Template ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Template details</returns>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var template = await _templateService.GetByIdAsync(id, userEmail, ct);
                if (template == null)
                    return NotFound(ApiResponse<string>.Fail($"Template with ID {id} was not found"));

                return Ok(ApiResponse<EmailTemplateResponse>.Ok(template, "Template retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting template by id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new template
        /// </summary>
        /// <param name="request">Template information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created template</returns>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmailTemplateRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var id = await _templateService.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Template created successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating template");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update template
        /// </summary>
        /// <param name="id">Template ID</param>
        /// <param name="request">Updated template information</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Success status</returns>
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateEmailTemplateRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var success = await _templateService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Template with ID {id} was not found"));

                return Ok(ApiResponse<bool>.Ok(true, "Template updated successfully"));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating template");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete template
        /// </summary>
        /// <param name="id">Template ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Success status</returns>
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var success = await _templateService.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Template with ID {id} was not found"));

                return Ok(ApiResponse<bool>.Ok(true, "Template deleted successfully"));
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting template");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Render template with variable replacement (preview)
        /// </summary>
        /// <param name="request">Render request with template ID and variable values</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Rendered template</returns>
        [HttpPost("render")]
        public async Task<IActionResult> RenderTemplate([FromBody] RenderEmailTemplateRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var rendered = await _templateService.RenderTemplateAsync(request, userEmail, ct);
                return Ok(ApiResponse<RenderedEmailTemplateResponse>.Ok(rendered, "Template rendered successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error rendering template");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Use template (send email)
        /// </summary>
        /// <param name="request">Use template request with recipient and variable values</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Success status</returns>
        [HttpPost("use")]
        public async Task<IActionResult> UseTemplate([FromBody] UseEmailTemplateRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = GetCurrentUserId();
                var success = await _templateService.UseTemplateAsync(request, userEmail, ct);
                return Ok(ApiResponse<bool>.Ok(success, "Template used successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(ApiResponse<string>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error using template");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get all available variables
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of variables grouped by entity type</returns>
        [HttpGet("variables")]
        public async Task<IActionResult> GetAvailableVariables(CancellationToken ct = default)
        {
            try
            {
                var variables = await _templateService.GetAvailableVariablesAsync(ct);
                return Ok(ApiResponse<IEnumerable<GroupedVariablesResponse>>.Ok(variables, "Variables retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting variables");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Helper method to get current user email from context or JWT token
        /// </summary>
        private string GetCurrentUserId()
        {
            // Try to get from HttpContext.Items first (set by middleware)
            var userEmail = HttpContext.Items["UserEmail"]?.ToString();
            if (!string.IsNullOrEmpty(userEmail))
                return userEmail;

            // Fallback: Extract from JWT claims
            var emailClaim = HttpContext.User.FindFirst("email") ?? 
                            HttpContext.User.FindFirst("http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress") ??
                            HttpContext.User.FindFirst("preferred_username");
            
            if (emailClaim != null && !string.IsNullOrEmpty(emailClaim.Value))
                return emailClaim.Value;

            // Development fallback
            return "henrik.kristensen@coreone.dk";
        }
    }
}
