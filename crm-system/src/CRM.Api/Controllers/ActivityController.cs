using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;
using System.Text.Json;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Activities (CRM Activities management) with CRUD and advanced query
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/activities")]
    public class ActivityController : ControllerBase
    {
        private readonly IActivityService _activityService;

        /// <summary>
        /// Init ActivityController
        /// </summary>
        public ActivityController(IActivityService activityService)
        {
            _activityService = activityService;
        }

        /// <summary>
        /// Lấy Paginated list of activities và filtering
        /// </summary>
        /// <param name="request">Activity query request với các tham số filtering</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of activities</returns>
        /// <response code="200">Successfully returned List of activities</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        public async Task<IActionResult> GetActivities([FromQuery] ActivityQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _activityService.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<ActivityResponse>>.Ok(result, "Activities retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error querying activities");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Query activities with advanced domain filter (JSON expression) and field selection
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Records per page (default: 10, max: 100)</param>
        /// <param name="sortColumn">Column name to sort by</param>
        /// <param name="sortOrder">Sort order: asc or desc (default: asc)</param>
        /// <param name="body">Domain filter wrapper containing filter conditions</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of activities</returns>
        /// <response code="200">Successfully returned activities list</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost("query-domain")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ActivityResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> QueryWithDomain(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] ActivityDomainQueryWrapper? body = null,
            CancellationToken ct = default)
        {
            try
            {
                var request = new ActivityQueryRequest
                {
                    Page = page,
                    PageSize = pageSize
                };

                // Handle sort - client sends camelCase (e.g., "createdOn")
                // Repository will map to "CreatedOn ASC"
                if (!string.IsNullOrWhiteSpace(sortColumn))
                {
                    var field = sortColumn.Trim();
                    var orderBy = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase)
                        ? $"-{field}"
                        : field;
                    request.OrderBy = orderBy;
                }

                // Handle filters - client sends camelCase, map to PascalCase
                var filters = body?.Request?.Filters;
                if (filters != null && filters.Any())
                {
                    // Use generic filter processor instead of hardcoded switch
                    FieldMapper.ProcessFilters(filters, request);
                }

                var result = await _activityService.QueryAsync(request);
                return Ok(ApiResponse<PagedResult<ActivityResponse>>.Ok(
                    result,
                    $"Retrieved page {page} of activities successfully. Total records: {result.TotalCount}"
                ));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error in QueryWithDomain for activities");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get activity by ID
        /// </summary>
        /// <param name="id">Activity ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Activity details</returns>
        /// <response code="200">Successfully returned activity details</response>
        /// <response code="404">Activity not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                var activity = await _activityService.GetByIdAsync(id, ct);
                if (activity == null)
                    return NotFound(ApiResponse<string>.Fail($"Activity with ID {id} was not found"));

                return Ok(ApiResponse<ActivityResponse>.Ok(activity, "Activity retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting activity by id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new activity
        /// </summary>
        /// <param name="request">Activity information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created activity</returns>
        /// <response code="201">Successfully created activity, returns ID</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateActivityRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _activityService.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Activity created successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating activity");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update activity
        /// </summary>
        /// <param name="id">Activity ID to update</param>
        /// <param name="request">Activity information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Updated activity information</returns>
        /// <response code="200">Successfully updated activity</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="404">Activity not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateActivityRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _activityService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Activity with ID {id} was not found"));

                // Get the updated activity to return it
                var updatedActivity = await _activityService.GetByIdAsync(id, ct);
                return Ok(ApiResponse<ActivityResponse>.Ok(updatedActivity!, "Activity updated successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating activity with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new activity with participants and attachments
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created activity</returns>
        /// <response code="201">Successfully created activity with participants and attachments</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost("with-participants-and-attachments")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateWithParticipantsAndAttachments(
            CancellationToken ct = default)
        {
            try
            {
                // Manually parse the multipart form data
                var form = await Request.ReadFormAsync(ct);

                // Deserialize Activity from JSON string
                var activityJson = form["Activity"].ToString();
                if (string.IsNullOrEmpty(activityJson))
                {
                    return BadRequest(ApiResponse<string>.Fail("Activity field is required"));
                }

                var activity = JsonSerializer.Deserialize<CreateActivityRequest>(activityJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });

                if (activity == null)
                {
                    return BadRequest(ApiResponse<string>.Fail("Invalid Activity data"));
                }

                // Deserialize Participants from JSON string (optional)
                List<ParticipantInput>? participants = null;
                var participantsJson = form["Participants"].ToString();
                if (!string.IsNullOrEmpty(participantsJson))
                {
                    participants = JsonSerializer.Deserialize<List<ParticipantInput>>(participantsJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                }

                // Deserialize EmailRecipients from JSON string (optional)
                List<string>? emailRecipients = null;
                var emailRecipientsJson = form["EmailRecipients"].ToString();
                if (!string.IsNullOrEmpty(emailRecipientsJson))
                {
                    emailRecipients = JsonSerializer.Deserialize<List<string>>(emailRecipientsJson, new JsonSerializerOptions
                    {
                        PropertyNameCaseInsensitive = true
                    });
                }

                // Get files
                var files = form.Files.GetFiles("files").ToList();

                // Create the request object
                var request = new CreateActivityWithParticipantsAndAttachmentsRequest
                {
                    Activity = activity,
                    Participants = participants,
                    EmailRecipients = emailRecipients
                };

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _activityService.CreateWithParticipantsAndAttachmentsAsync(request, files ?? new List<IFormFile>(), userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Activity created successfully with participants and attachments"));
            }
            catch (JsonException jex)
            {
                Log.Error(jex, "JSON deserialization error in CreateWithParticipantsAndAttachments");
                return BadRequest(ApiResponse<string>.Fail("Invalid JSON format in request"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("CreateWithParticipantsAndAttachments - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating activity with participants and attachments");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete activity
        /// </summary>
        /// <param name="id">Activity ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Successfully deleted activity</response>
        /// <response code="404">Activity not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _activityService.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Activity with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Activity deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting activity with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }
    }
}
