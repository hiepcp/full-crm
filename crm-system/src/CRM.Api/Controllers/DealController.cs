using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Deals (CRM Deals management)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/deals")]
    public class DealController : ControllerBase
    {
        private readonly IDealService _dealService;
        private readonly IDealQuotationStatusService _dealQuotationStatusService;

        /// <summary>
        /// Init DealController
        /// </summary>
        /// <param name="dealService"></param>
        /// <param name="dealQuotationStatusService"></param>
        public DealController(IDealService dealService, IDealQuotationStatusService dealQuotationStatusService)
        {
            _dealService = dealService;
            _dealQuotationStatusService = dealQuotationStatusService;
        }

        /// <summary>
        /// Query deals with pagination and filtering
        /// </summary>
        /// <param name="request">Deal query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of deals</returns>
        /// <response code="200">Successfully returned deals list</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<DealResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetDeals(
            [FromQuery] DealQueryRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetDeals - Processing GET request with query parameters");

                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (request.Top.HasValue && request.Top.Value < 0)
                    return BadRequest(ApiResponse<string>.Fail("Top value must be non-negative"));

                Log.Information("Query - Executing deals query with request: {@Request}", request);
                var result = await _dealService.QueryAsync(request, ct);

                Log.Information("GetDeals - Retrieved page {Page}. Total records: {TotalCount}",
                    request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<DealResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of deals successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("GetDeals - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetDeals - Error querying deals");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying deals: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get deal by ID
        /// </summary>
        /// <param name="id">Deal ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deal details</returns>
        /// <response code="200">Successfully returned deal details</response>
        /// <response code="404">Deal not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<DealResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetById - Starting request for id: {Id}", id);

                var deal = await _dealService.GetByIdAsync(id, ct);
                if (deal == null)
                {
                    Log.Warning("GetById - Deal not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Deal with ID {id} was not found"));
                }

                Log.Information("GetById - Successfully retrieved deal with id: {Id}", id);
                return Ok(ApiResponse<DealResponse>.Ok(deal, "Get deal successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetById - Error retrieving deal with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the deal: {ex.Message}"));
            }
        }

        /// <summary>
        /// Query deals with advanced domain filter (JSON expression) và field selection.
        /// Sử dụng DealQueryRequest trong body để truyền domain filter và fields.
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Records per page (default: 10, max: 100)</param>
        /// <param name="sortColumn">Column name to sort by</param>
        /// <param name="sortOrder">Sort order: asc or desc (default: asc)</param>
        /// <param name="body">Domain filter wrapper containing filter conditions</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of deals</returns>
        /// <response code="200">Successfully returned List of deals</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [Authorize(Policy = "Deal.Read")]
        [HttpPost("query-domain")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<DealResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> QueryWithDomain(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] DealDomainQueryWrapper? body = null,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("QueryWithDomain - Starting domain query");

                // Validate pagination
                if (page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (pageSize < 1 || pageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (!string.IsNullOrEmpty(sortOrder) &&
                    !sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase) &&
                    !sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(ApiResponse<string>.Fail("Sort order must be either 'asc' or 'desc'"));
                }

                // Build DealQueryRequest from query params and body filters
                var request = new DealQueryRequest
                {
                    Page = page,
                    PageSize = pageSize
                };

                if (!string.IsNullOrWhiteSpace(sortColumn))
                {
                    var field = sortColumn.Trim();
                    var orderBy = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase)
                        ? $"-{field.ToLower()}"
                        : field.ToLower();
                    request.OrderBy = orderBy;
                }

                var filters = body?.Request?.Filters;
                if (filters != null && filters.Any())
                {
                    foreach (var f in filters)
                    {
                        var column = f.Column?.Trim();
                        if (string.IsNullOrEmpty(column)) continue;
                        var op = f.Operator?.Trim().ToLower();
                        var val = f.Value?.ToString();
                        if (string.IsNullOrEmpty(val)) continue;

                        switch (column.ToLower())
                        {
                            case "status":
                                request.Domain = val;
                                break;
                            default:
                                // Unknown columns can be placed into extension data for future use
                                request.AddExtensionProperty(column, val);
                                break;
                        }
                    }
                }

                Log.Information("QueryWithDomain - Executing domain query with mapped request: {@Request}", request);
                var result = await _dealService.QueryAsync(request, ct);

                Log.Information("QueryWithDomain - Retrieved page {Page}. Total records: {TotalCount}", request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<DealResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of deals successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("QueryWithDomain - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "QueryWithDomain - Error querying deals with domain filter");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying deals: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new deal
        /// </summary>
        /// <param name="request">deal information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created deal</returns>
        /// <response code="201">Successfully created deal, returns ID</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Create([FromBody] CreateDealRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Create - Starting deal creation");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _dealService.CreateAsync(request, userEmail, ct);

                Log.Information("Create - Successfully created deal with id: {Id}", id);
                return CreatedAtAction(nameof(GetById), new { id },
                    ApiResponse<long>.Ok(id, "Deal created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Create - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Create - Error creating deal");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to create deal: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update deal
        /// </summary>
        /// <param name="id">Deal ID to update</param>
        /// <param name="request">deal information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Updated deal details</returns>
        /// <response code="200">Successfully updated deal, returns updated deal data</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="404">deal</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<DealResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateDealRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Update - Starting deal update for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _dealService.UpdateAsync(id, request, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Update - Deal not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Deal with ID {id} was not found"));
                }

                // Fetch and return the updated deal
                var updatedDeal = await _dealService.GetByIdAsync(id, ct);
                if (updatedDeal == null)
                {
                    Log.Error("Update - Failed to retrieve updated deal with id: {Id}", id);
                    return StatusCode(500, ApiResponse<string>.Fail("Deal was updated but could not retrieve updated data"));
                }

                Log.Information("Update - Successfully updated deal with id: {Id}", id);
                return Ok(ApiResponse<DealResponse>.Ok(updatedDeal, "Deal updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Update - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Update - Error updating deal with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to update deal: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete deal
        /// </summary>
        /// <param name="id">Deal ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete deal thành công</response>
        /// <response code="404">deal</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Delete - Starting deal deletion for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _dealService.DeleteAsync(id, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Delete - Deal not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Deal with ID {id} was not found"));
                }

                Log.Information("Delete - Successfully deleted deal with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Deal deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Delete - Error deleting deal with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete deal: {ex.Message}"));
            }
        }

        /// <summary>
        /// Evaluate and update deal pipeline based on Dynamics 365 quotation statuses
        /// </summary>
        /// <param name="dealId">The deal ID to evaluate</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Success response</returns>
        /// <response code="200">Pipeline evaluated successfully</response>
        /// <response code="400">Invalid deal ID</response>
        /// <response code="404">Deal not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost("{dealId}/evaluate-pipeline")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> EvaluatePipeline(long dealId, CancellationToken ct = default)
        {
            try
            {
                if (dealId <= 0)
                {
                    return BadRequest(ApiResponse<string>.Fail("Deal ID must be greater than 0"));
                }

                Log.Information("EvaluatePipeline - Starting pipeline evaluation for deal {DealId}", dealId);

                var userEmail = User.FindFirst(System.Security.Claims.ClaimTypes.Email)?.Value ?? "system";
                await _dealQuotationStatusService.EvaluateAndUpdateDealStageAsync(dealId, userEmail, ct);

                Log.Information("EvaluatePipeline - Successfully evaluated pipeline for deal {DealId}", dealId);
                return Ok(ApiResponse<string>.Ok("Pipeline evaluated successfully"));
            }
            catch (KeyNotFoundException)
            {
                Log.Warning("EvaluatePipeline - Deal not found for id: {Id}", dealId);
                return NotFound(ApiResponse<string>.Fail($"Deal with ID {dealId} was not found"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "EvaluatePipeline - Error evaluating pipeline for deal {DealId}", dealId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to evaluate pipeline: {ex.Message}"));
            }
        }
    }
}
