using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Assignees (User assignments to entities) with CRUD and advanced query
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/assignees")]
    public class AssigneesController : ControllerBase
    {
        private readonly IAssigneeService _assigneeService;

        /// <summary>
        /// Init
        /// </summary>
        /// <param name="assigneeService"></param>
        public AssigneesController(IAssigneeService assigneeService)
        {
            _assigneeService = assigneeService;
        }

        /// <summary>
        /// Query assignees với pagination, filtering, ordering, top N và field selection.
        /// Sử dụng query parameters cho simple filters và domain filters.
        /// </summary>
        /// <param name="request">Assignee query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of assignees</returns>
        /// <response code="200">Successfully returned List of assignees</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<AssigneeResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetAssignees(
            [FromQuery] AssigneeQueryRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetAssignees - Processing GET request with query parameters");

                // Validate input parameters for GET
                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (request.Top.HasValue && request.Top.Value < 0)
                    return BadRequest(ApiResponse<string>.Fail("Top value must be non-negative"));

                Log.Information("Query - Executing assignees query with request: {@Request}", request);
                var result = await _assigneeService.QueryAsync(request, ct);

                Log.Information("GetAssignees - Retrieved page {Page}. Total records: {TotalCount}",
                    request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<AssigneeResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of assignees successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("GetAssignees - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetAssignees - Error querying assignees");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying assignees: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get assignee by ID
        /// </summary>
        /// <param name="id">Assignee ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>assignee</returns>
        /// <response code="200">Successfully returned assignee details</response>
        /// <response code="404">assignee</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<AssigneeResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetById - Starting request for id: {Id}", id);

                var assignee = await _assigneeService.GetByIdAsync(id, ct);
                if (assignee == null)
                {
                    Log.Warning("GetById - Assignee not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Assignee with ID {id} was not found"));
                }

                Log.Information("GetById - Successfully retrieved assignee with id: {Id}", id);
                return Ok(ApiResponse<AssigneeResponse>.Ok(assignee, "Get assignee successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetById - Error retrieving assignee with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the assignee: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new assignee
        /// </summary>
        /// <param name="request">assignee information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created assignee</returns>
        /// <response code="201">Successfully created assignee, returns ID</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Create([FromBody] CreateAssigneeRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Create - Starting assignee creation");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _assigneeService.CreateAsync(request, userEmail, ct);

                Log.Information("Create - Successfully created assignee with id: {Id}", id);
                return CreatedAtAction(nameof(GetById), new { id },
                    ApiResponse<long>.Ok(id, "Assignee created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Create - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Create - Error creating assignee");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to create assignee: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update assignee
        /// </summary>
        /// <param name="id">Assignee ID to update</param>
        /// <param name="request">assignee information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update assignee thành công</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="404">assignee</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateAssigneeRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Update - Starting assignee update for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _assigneeService.UpdateAsync(id, request, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Update - Assignee not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Assignee with ID {id} was not found"));
                }

                Log.Information("Update - Successfully updated assignee with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Assignee updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Update - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Update - Error updating assignee with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to update assignee: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete assignee
        /// </summary>
        /// <param name="id">Assignee ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete assignee thành công</response>
        /// <response code="404">assignee</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Delete - Starting assignee deletion for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _assigneeService.DeleteAsync(id, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Delete - Assignee not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Assignee with ID {id} was not found"));
                }

                Log.Information("Delete - Successfully deleted assignee with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Assignee deleted successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Delete - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Delete - Error deleting assignee with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete assignee: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy assignees theo relation (ví dụ: tất cả assignees của một lead)
        /// </summary>
        [HttpGet("by-relation")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<AssigneeResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetByRelation(
            [FromQuery] string relationType,
            [FromQuery] long relationId,
            CancellationToken ct = default)
        {
            try
            {
                if (string.IsNullOrEmpty(relationType))
                    return BadRequest(ApiResponse<string>.Fail("Relation type is required"));

                if (relationId <= 0)
                    return BadRequest(ApiResponse<string>.Fail("Relation ID must be greater than 0"));

                Log.Information("GetByRelation - Getting assignees for {RelationType} {RelationId}",
                    relationType, relationId);

                var assignees = await _assigneeService.GetByRelationAsync(relationType, relationId, ct);

                Log.Information("GetByRelation - Retrieved {Count} assignees for {RelationType} {RelationId}",
                    assignees.Count(), relationType, relationId);

                return Ok(ApiResponse<IEnumerable<AssigneeResponse>>.Ok(
                    assignees,
                    $"Retrieved assignees for {relationType} {relationId} successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetByRelation - Error retrieving assignees for {RelationType} {RelationId}",
                    relationType, relationId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving assignees: {ex.Message}"));
            }
        }
    }
}













