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
    /// Controller for managing Activity Participants
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/activity-participants")]
    public class ActivityParticipantsController : ControllerBase
    {
        private readonly IActivityParticipantService _service;

        /// <summary>
        /// Init ActivityParticipantsController
        /// </summary>
        /// <param name="service"></param>
        public ActivityParticipantsController(IActivityParticipantService service)
        {
            _service = service;
        }

        /// <summary>
        /// Query activity participants with pagination and filtering
        /// </summary>
        /// <param name="request">Activity participant query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of activity participants</returns>
        /// <response code="200">Successfully returned List of participants</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ActivityParticipantResponse>>), 200)]
        public async Task<IActionResult> Get([FromQuery] ActivityParticipantQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _service.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<ActivityParticipantResponse>>.Ok(result, "Participants retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error querying activity participants");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new activity participant
        /// </summary>
        /// <param name="request">participant information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created participant</returns>
        /// <response code="201">Successfully created participant, returns ID</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        public async Task<IActionResult> Create([FromBody] CreateActivityParticipantRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _service.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Participant created successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating activity participant");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get activity participant by ID
        /// </summary>
        /// <param name="id">Participant ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>participant</returns>
        /// <response code="200">Successfully returned participant details</response>
        /// <response code="404">participant</response>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<ActivityParticipantResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            var item = await _service.GetByIdAsync(id, ct);
            if (item == null)
            {
                return NotFound(ApiResponse<string>.Fail($"Participant with ID {id} was not found"));
            }
            return Ok(ApiResponse<ActivityParticipantResponse>.Ok(item, "Participant retrieved successfully"));
        }

        /// <summary>
        /// Update activity participant
        /// </summary>
        /// <param name="id">Participant ID to update</param>
        /// <param name="request">participant information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update participant thành công</response>
        /// <response code="404">participant</response>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateActivityParticipantRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _service.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Participant with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Participant updated successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating activity participant with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete activity participant
        /// </summary>
        /// <param name="id">Participant ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete participant thành công</response>
        /// <response code="404">participant</response>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _service.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Participant with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Participant deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting activity participant with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }
    }
}

