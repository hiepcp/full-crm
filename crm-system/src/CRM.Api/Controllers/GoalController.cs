using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// GoalController
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/goals")]
    public class GoalController : ControllerBase
    {
        private readonly IGoalService _goalService;

        /// <summary>
        /// Init GoalController
        /// </summary>
        /// <param name="goalService"></param>
        public GoalController(IGoalService goalService)
        {
            _goalService = goalService;
        }

        /// <summary>
        /// GetGoals
        /// </summary>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<GoalResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetGoals([FromQuery] GoalQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _goalService.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<GoalResponse>>.Ok(result, "Goals retrieved successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error querying goals");
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
        [ProducesResponseType(typeof(ApiResponse<GoalResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                var goal = await _goalService.GetByIdAsync(id, ct);
                if (goal == null)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                return Ok(ApiResponse<GoalResponse>.Ok(goal, "Goal retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error fetching goal {GoalId}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create
        /// </summary>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Create([FromBody] CreateGoalRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _goalService.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Goal created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (UnauthorizedAccessException uaex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(uaex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating goal");
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
        [ProducesResponseType(typeof(ApiResponse<GoalResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateGoalRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _goalService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                var updated = await _goalService.GetByIdAsync(id, ct);
                return Ok(ApiResponse<GoalResponse>.Ok(updated!, "Goal updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (UnauthorizedAccessException uaex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(uaex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating goal {GoalId}", id);
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
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _goalService.DeleteAsync(id, userEmail, ct);
                if (!success)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                return Ok(ApiResponse<string>.Ok(string.Empty, "Goal deleted successfully"));
            }
            catch (UnauthorizedAccessException uaex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(uaex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting goal {GoalId}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// GetMetrics
        /// </summary>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("metrics")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<GoalMetricsResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetMetrics([FromQuery] GoalMetricsRequest request, CancellationToken ct = default)
        {
            try
            {
                var metrics = await _goalService.GetMetricsAsync(request, ct);
                return Ok(ApiResponse<IEnumerable<GoalMetricsResponse>>.Ok(metrics, "Goal metrics retrieved successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error retrieving goal metrics");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        // === Auto-Calculation Endpoints (US1) ===

        /// <summary>
        /// ManualAdjustProgress - Override auto-calculated progress with manual value
        /// </summary>
        /// <param name="id"></param>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost("{id:long}/manual-adjustment")]
        [ProducesResponseType(typeof(ApiResponse<GoalResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> ManualAdjustProgress(long id, [FromBody] ManualProgressAdjustmentRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var result = await _goalService.ManualAdjustProgressAsync(id, request, userEmail, ct);
                if (result == null)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                return Ok(ApiResponse<GoalResponse>.Ok(result, "Progress manually adjusted successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (UnauthorizedAccessException uaex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(uaex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error manually adjusting progress for goal {GoalId}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// RecalculateProgress - Trigger immediate recalculation for auto-calculated goals
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost("{id:long}/recalculate")]
        [ProducesResponseType(typeof(ApiResponse<GoalResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> RecalculateProgress(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var result = await _goalService.RecalculateProgressAsync(id, userEmail, ct);
                if (result == null)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                return Ok(ApiResponse<GoalResponse>.Ok(result, "Progress recalculated successfully"));
            }
            catch (InvalidOperationException ioex)
            {
                return BadRequest(ApiResponse<string>.Fail(ioex.Message));
            }
            catch (UnauthorizedAccessException uaex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(uaex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error recalculating progress for goal {GoalId}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// GetForecast - Get velocity-based progress forecast for a goal
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("{id:long}/forecast")]
        [ProducesResponseType(typeof(ApiResponse<GoalForecastResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetForecast(long id, CancellationToken ct = default)
        {
            try
            {
                var result = await _goalService.GetForecastAsync(id, ct);
                if (result == null)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                return Ok(ApiResponse<GoalForecastResponse>.Ok(result, "Forecast retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting forecast for goal {GoalId}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// GetProgressHistory - Get historical progress snapshots for a goal
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("{id:long}/progress-history")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<GoalProgressHistory>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetProgressHistory(long id, CancellationToken ct = default)
        {
            try
            {
                var result = await _goalService.GetProgressHistoryAsync(id, ct);
                return Ok(ApiResponse<IEnumerable<GoalProgressHistory>>.Ok(result, "Progress history retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting progress history for goal {GoalId}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        // === Hierarchy Endpoints (US4) ===

        /// <summary>
        /// GetHierarchy - Get full hierarchy tree for a goal (ancestors + descendants)
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("{id:long}/hierarchy")]
        [ProducesResponseType(typeof(ApiResponse<GoalHierarchyResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetHierarchy(long id, CancellationToken ct = default)
        {
            try
            {
                var result = await _goalService.GetHierarchyAsync(id, ct);
                if (result == null)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                return Ok(ApiResponse<GoalHierarchyResponse>.Ok(result, "Goal hierarchy retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting hierarchy for goal {GoalId}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// LinkToParent - Link a goal to a parent goal (create hierarchy relationship)
        /// </summary>
        /// <param name="id"></param>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost("{id:long}/link-parent")]
        [ProducesResponseType(typeof(ApiResponse<GoalResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> LinkToParent(long id, [FromBody] LinkGoalToParentRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var result = await _goalService.LinkToParentAsync(id, request, userEmail, ct);
                if (result == null)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                return Ok(ApiResponse<GoalResponse>.Ok(result, "Goal linked to parent successfully"));
            }
            catch (InvalidOperationException ioex)
            {
                return BadRequest(ApiResponse<string>.Fail(ioex.Message));
            }
            catch (UnauthorizedAccessException uaex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(uaex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error linking goal {GoalId} to parent", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// UnlinkParent - Unlink a goal from its parent (orphan the goal)
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpPost("{id:long}/unlink-parent")]
        [ProducesResponseType(typeof(ApiResponse<GoalResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> UnlinkParent(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var result = await _goalService.UnlinkFromParentAsync(id, userEmail, ct);
                if (result == null)
                {
                    return NotFound(ApiResponse<string>.Fail($"Goal with ID {id} was not found"));
                }

                return Ok(ApiResponse<GoalResponse>.Ok(result, "Goal unlinked from parent successfully"));
            }
            catch (UnauthorizedAccessException uaex)
            {
                return StatusCode(403, ApiResponse<string>.Fail(uaex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error unlinking goal {GoalId} from parent", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// GetChildren - Get direct children of a goal
        /// </summary>
        /// <param name="id"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("{id:long}/children")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<GoalResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetChildren(long id, CancellationToken ct = default)
        {
            try
            {
                var result = await _goalService.GetChildrenAsync(id, ct);
                return Ok(ApiResponse<IEnumerable<GoalResponse>>.Ok(result, "Child goals retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting children for goal {GoalId}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        // === Analytics & Insights Endpoints (US5) ===

        /// <summary>
        /// GetAnalytics - Get comprehensive analytics with historical trends and insights
        /// </summary>
        /// <param name="request"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("analytics")]
        [ProducesResponseType(typeof(ApiResponse<GoalAnalyticsResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetAnalytics([FromQuery] GoalQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _goalService.GetAnalyticsAsync(request, ct);
                return Ok(ApiResponse<GoalAnalyticsResponse>.Ok(result, "Goal analytics retrieved successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error retrieving goal analytics");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }
    }
}
