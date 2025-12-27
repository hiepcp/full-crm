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
    /// ActivityAttachmentsController
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/activity-attachments")]
    public class ActivityAttachmentsController : ControllerBase
    {
        private readonly IActivityAttachmentService _service;

        /// <summary>
        /// ActivityAttachmentsController
        /// </summary>
        /// <param name="service"></param>
        public ActivityAttachmentsController(IActivityAttachmentService service)
        {
            _service = service;
        }

        /// <summary>
        /// Get
        /// </summary>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ActivityAttachmentResponse>>), 200)]
        public async Task<IActionResult> Get([FromQuery] ActivityAttachmentQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _service.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<ActivityAttachmentResponse>>.Ok(result, "Attachments retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error querying activity attachments");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// GetById
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<ActivityAttachmentResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            var item = await _service.GetByIdAsync(id, ct);
            if (item == null)
                return NotFound(ApiResponse<string>.Fail($"Attachment with ID {id} was not found"));
            return Ok(ApiResponse<ActivityAttachmentResponse>.Ok(item, "Attachment retrieved successfully"));
        }

        /// <summary>
        /// Create
        /// </summary>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        public async Task<IActionResult> Create([FromBody] CreateActivityAttachmentRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _service.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Attachment created successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating activity attachment");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update
        /// </summary>
        /// <param name="id"></param>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateActivityAttachmentRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _service.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Attachment with ID {id} was not found"));
                return Ok(ApiResponse<string>.Ok("", "Attachment updated successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating activity attachment with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _service.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Attachment with ID {id} was not found"));
                return Ok(ApiResponse<string>.Ok("", "Attachment deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting activity attachment with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }
    }
}

