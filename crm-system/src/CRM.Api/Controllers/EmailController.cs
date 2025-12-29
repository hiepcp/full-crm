using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.Dapper.Models;
using Shared.AuthN.Common;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Emails (CRM Emails management)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/emails")]
    public class EmailController : ControllerBase
    {
        private readonly IEmailService _emailService;

        /// <summary>
        /// Init EmailController
        /// </summary>
        /// <param name="emailService"></param>
        public EmailController(IEmailService emailService)
        {
            _emailService = emailService;
        }

        /// <summary>
        /// Query emails with pagination and filtering
        /// </summary>
        /// <param name="request">Email query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of emails</returns>
        /// <response code="200">Successfully returned List of emails</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        public async Task<IActionResult> GetEmails([FromQuery] EmailQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _emailService.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<EmailResponse>>.Ok(result, "Emails retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error querying emails");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get email by ID
        /// </summary>
        /// <param name="id">Email ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>email</returns>
        /// <response code="200">Successfully returned email details</response>
        /// <response code="404">email</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                var email = await _emailService.GetByIdAsync(id, ct);
                if (email == null)
                    return NotFound(ApiResponse<string>.Fail($"Email with ID {id} was not found"));

                return Ok(ApiResponse<EmailResponse>.Ok(email, "Email retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting email by id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new email
        /// </summary>
        /// <param name="request">email information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created email</returns>
        /// <response code="201">Successfully created email, returns ID</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateEmailRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _emailService.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Email created successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating email");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update email
        /// </summary>
        /// <param name="id">Email ID to update</param>
        /// <param name="request">email information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update email thành công</response>
        /// <response code="404">email</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateEmailRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _emailService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Email with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Email updated successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating email with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete email
        /// </summary>
        /// <param name="id">Email ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete email thành công</response>
        /// <response code="404">email</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _emailService.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Email with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Email deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting email with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }
    }
}
