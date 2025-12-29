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
    /// Controller for managing Pipeline Logs (CRM Pipeline Logs management)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/pipeline-logs")]
    public class PipelineLogController : ControllerBase
    {
        private readonly IPipelineLogService _pipelineLogService;

        /// <summary>
        /// Init
        /// </summary>
        /// <param name="pipelineLogService"></param>
        public PipelineLogController(IPipelineLogService pipelineLogService)
        {
            _pipelineLogService = pipelineLogService;
        }

        /// <summary>
        /// Query pipeline logs with pagination and filtering
        /// </summary>
        /// <param name="request">Pipeline log query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of pipeline logs</returns>
        /// <response code="200">Successfully returned List of pipeline logs</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<PipelineLogResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetPipelineLogs(
            [FromQuery] PipelineLogQueryRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetPipelineLogs - Processing GET request with query parameters");

                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (request.Top.HasValue && request.Top.Value < 0)
                    return BadRequest(ApiResponse<string>.Fail("Top value must be non-negative"));

                Log.Information("Query - Executing pipeline logs query with request: {@Request}", request);
                var result = await _pipelineLogService.QueryAsync(request, ct);

                Log.Information("GetPipelineLogs - Retrieved page {Page}. Total records: {TotalCount}",
                    request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<PipelineLogResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of pipeline logs successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("GetPipelineLogs - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetPipelineLogs - Error querying pipeline logs");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying pipeline logs: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get pipeline log by ID
        /// </summary>
        /// <param name="id">Pipeline log ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>pipeline log</returns>
        /// <response code="200">Successfully returned pipeline log details</response>
        /// <response code="404">pipeline log</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<PipelineLogResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetById - Starting request for id: {Id}", id);

                var pipelineLog = await _pipelineLogService.GetByIdAsync(id, ct);
                if (pipelineLog == null)
                {
                    Log.Warning("GetById - Pipeline log not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Pipeline log with ID {id} was not found"));
                }

                Log.Information("GetById - Successfully retrieved pipeline log with id: {Id}", id);
                return Ok(ApiResponse<PipelineLogResponse>.Ok(pipelineLog, "Get pipeline log successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetById - Error retrieving pipeline log with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving pipeline log: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new pipeline log
        /// </summary>
        /// <param name="request">pipeline log information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created pipeline log</returns>
        /// <response code="201">Successfully created pipeline log, returns ID</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Create(
            [FromBody] CreatePipelineLogRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("Create - Starting create pipeline log request");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _pipelineLogService.CreateAsync(request, userEmail, ct);

                Log.Information("Create - Successfully created pipeline log with id: {Id}", id);
                return CreatedAtAction(
                    nameof(GetById),
                    new { id },
                    ApiResponse<long>.Ok(id, "Pipeline log created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Create - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Create - Error creating pipeline log");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while creating pipeline log: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update pipeline log
        /// </summary>
        /// <param name="id">Pipeline log ID to update</param>
        /// <param name="request">pipeline log information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update pipeline log thành công</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="404">pipeline log</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Update(
            long id,
            [FromBody] UpdatePipelineLogRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("Update - Starting update pipeline log request for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var result = await _pipelineLogService.UpdateAsync(id, request, userEmail, ct);

                if (!result)
                {
                    Log.Warning("Update - Pipeline log not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Pipeline log with ID {id} was not found"));
                }

                Log.Information("Update - Successfully updated pipeline log with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("Pipeline log updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Update - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Update - Error updating pipeline log with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while updating pipeline log: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete pipeline log
        /// </summary>
        /// <param name="id">Pipeline log ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete pipeline log thành công</response>
        /// <response code="404">pipeline log</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Delete - Starting delete pipeline log request for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var result = await _pipelineLogService.DeleteAsync(id, userEmail, ct);

                if (!result)
                {
                    Log.Warning("Delete - Pipeline log not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Pipeline log with ID {id} was not found"));
                }

                Log.Information("Delete - Successfully deleted pipeline log with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("Pipeline log deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Delete - Error deleting pipeline log with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while deleting pipeline log: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy pipeline logs theo deal ID
        /// </summary>
        [HttpGet("by-deal/{dealId:long}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PipelineLogResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetByDealId(long dealId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetByDealId - Starting request for deal id: {DealId}", dealId);

                var pipelineLogs = await _pipelineLogService.GetByDealIdAsync(dealId, ct);

                Log.Information("GetByDealId - Successfully retrieved {Count} pipeline logs for deal {DealId}",
                    pipelineLogs.Count(), dealId);
                return Ok(ApiResponse<IEnumerable<PipelineLogResponse>>.Ok(
                    pipelineLogs, $"Retrieved pipeline logs for deal {dealId} successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetByDealId - Error retrieving pipeline logs for deal {DealId}", dealId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving pipeline logs: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy pipeline logs theo stage
        /// </summary>
        [HttpGet("by-stage/{stage}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<PipelineLogResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetByStage(string stage, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetByStage - Starting request for stage: {Stage}", stage);

                var pipelineLogs = await _pipelineLogService.GetByStageAsync(stage, ct);

                Log.Information("GetByStage - Successfully retrieved {Count} pipeline logs for stage {Stage}",
                    pipelineLogs.Count(), stage);
                return Ok(ApiResponse<IEnumerable<PipelineLogResponse>>.Ok(
                    pipelineLogs, $"Retrieved pipeline logs for stage {stage} successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetByStage - Error retrieving pipeline logs for stage {Stage}", stage);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving pipeline logs: {ex.Message}"));
            }
        }
    }
}
