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
    /// Controller quản lý Deal-Quotation links (CRM Deal Quotation management)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/deal-quotations")]
    public class DealQuotationController : ControllerBase
    {
        private readonly IDealQuotationService _dealQuotationService;

        /// <summary>
        /// Init DealQuotationController
        /// </summary>
        /// <param name="dealQuotationService"></param>
        public DealQuotationController(IDealQuotationService dealQuotationService)
        {
            _dealQuotationService = dealQuotationService;
        }

        /// <summary>
        /// Query deal quotations với pagination và filtering
        /// </summary>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<DealQuotationResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetDealQuotations(
            [FromQuery] DealQuotationQueryRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetDealQuotations - Processing GET request with query parameters");

                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                var result = await _dealQuotationService.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<DealQuotationResponse>>.Ok(result, "Deal quotations retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetDealQuotations - Error occurred while querying deal quotations");
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Get deal quotation by ID
        /// </summary>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<DealQuotationResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetDealQuotation(
            long id,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetDealQuotation - Processing GET request for ID: {Id}", id);

                var result = await _dealQuotationService.GetByIdAsync(id, ct);
                if (result == null)
                    return NotFound(ApiResponse<string>.Fail($"Deal quotation with ID {id} not found"));

                return Ok(ApiResponse<DealQuotationResponse>.Ok(result, "Deal quotation retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetDealQuotation - Error occurred while getting deal quotation with ID: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Create new deal quotation link
        /// </summary>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> CreateDealQuotation(
            [FromBody] CreateDealQuotationRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("CreateDealQuotation - Processing POST request");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

                var result = await _dealQuotationService.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(
                    nameof(GetDealQuotation),
                    new { id = result },
                    ApiResponse<long>.Ok(result, "Deal quotation created successfully"));
            }
            catch (FluentValidation.ValidationException ex)
            {
                Log.Warning(ex, "CreateDealQuotation - Validation failed");
                return BadRequest(ApiResponse<string>.Fail(string.Join(", ", ex.Errors.Select(e => e.ErrorMessage))));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "CreateDealQuotation - Error occurred while creating deal quotation");
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Bulk create deal quotation links
        /// </summary>
        [HttpPost("bulk")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<long>>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> BulkCreateDealQuotations(
            [FromBody] IEnumerable<CreateDealQuotationRequest> requests,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("BulkCreateDealQuotations - Processing POST request for bulk creation");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

                var result = await _dealQuotationService.BulkCreateAsync(requests, userEmail, ct);
                return Created(string.Empty, ApiResponse<IEnumerable<long>>.Ok(result, "Deal quotations created successfully"));
            }
            catch (FluentValidation.ValidationException ex)
            {
                Log.Warning(ex, "BulkCreateDealQuotations - Validation failed");
                return BadRequest(ApiResponse<string>.Fail(string.Join(", ", ex.Errors.Select(e => e.ErrorMessage))));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "BulkCreateDealQuotations - Error occurred while bulk creating deal quotations");
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Update deal quotation link
        /// </summary>
        [HttpPut("{id}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> UpdateDealQuotation(
            long id,
            [FromBody] UpdateDealQuotationRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("UpdateDealQuotation - Processing PUT request for ID: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

                var success = await _dealQuotationService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Deal quotation with ID {id} not found"));

                return Ok(ApiResponse<string>.Ok("Deal quotation updated successfully"));
            }
            catch (FluentValidation.ValidationException ex)
            {
                Log.Warning(ex, "UpdateDealQuotation - Validation failed");
                return BadRequest(ApiResponse<string>.Fail(string.Join(", ", ex.Errors.Select(e => e.ErrorMessage))));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "UpdateDealQuotation - Error occurred while updating deal quotation with ID: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Delete deal quotation link
        /// </summary>
        [HttpDelete("{id}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> DeleteDealQuotation(
            long id,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("DeleteDealQuotation - Processing DELETE request for ID: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

                var success = await _dealQuotationService.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Deal quotation with ID {id} not found"));

                return Ok(ApiResponse<string>.Ok("Deal quotation deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "DeleteDealQuotation - Error occurred while deleting deal quotation with ID: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Get deal quotations by deal ID
        /// </summary>
        [HttpGet("by-deal/{dealId}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DealQuotationResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetDealQuotationsByDealId(
            long dealId,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetDealQuotationsByDealId - Processing GET request for deal ID: {DealId}", dealId);

                var result = await _dealQuotationService.GetByDealIdAsync(dealId, ct);
                return Ok(ApiResponse<IEnumerable<DealQuotationResponse>>.Ok(result, "Deal quotations retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetDealQuotationsByDealId - Error occurred while getting deal quotations for deal ID: {DealId}", dealId);
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Get deal quotations by quotation number
        /// </summary>
        [HttpGet("by-quotation/{quotationNumber}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DealQuotationResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetDealQuotationsByQuotationNumber(
            string quotationNumber,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetDealQuotationsByQuotationNumber - Processing GET request for quotation number: {QuotationNumber}", quotationNumber);

                var result = await _dealQuotationService.GetByQuotationNumberAsync(quotationNumber, ct);
                return Ok(ApiResponse<IEnumerable<DealQuotationResponse>>.Ok(result, "Deal quotations retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetDealQuotationsByQuotationNumber - Error occurred while getting deal quotations for quotation number: {QuotationNumber}", quotationNumber);
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Delete all deal quotations for a deal
        /// </summary>
        [HttpDelete("by-deal/{dealId}")]
        [ProducesResponseType(typeof(ApiResponse<int>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> DeleteDealQuotationsByDealId(
            long dealId,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("DeleteDealQuotationsByDealId - Processing DELETE request for deal ID: {DealId}", dealId);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

                var deletedCount = await _dealQuotationService.DeleteByDealIdAsync(dealId, userEmail, ct);
                return Ok(ApiResponse<int>.Ok(deletedCount, $"Deleted {deletedCount} deal quotation(s) successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "DeleteDealQuotationsByDealId - Error occurred while deleting deal quotations for deal ID: {DealId}", dealId);
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }

        /// <summary>
        /// Lấy danh sách quotations của deal kèm thông tin chi tiết từ Dynamics 365
        /// </summary>
        [HttpGet("deal/{dealId:long}/quotations-with-dynamics")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DealQuotationWithDynamicsDataResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetQuotationsWithDynamicsDataByDealId(long dealId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetQuotationsWithDynamicsDataByDealId - Processing GET request for deal ID: {DealId}", dealId);

                var result = await _dealQuotationService.GetQuotationsWithDynamicsDataByDealIdAsync(dealId, ct);

                return Ok(ApiResponse<IEnumerable<DealQuotationWithDynamicsDataResponse>>.Ok(
                    result,
                    $"Retrieved {result.Count()} quotations with dynamics data for deal {dealId} successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetQuotationsWithDynamicsDataByDealId - Error occurred while getting quotations for deal ID: {DealId}", dealId);
                return StatusCode(500, ApiResponse<string>.Fail("An error occurred while processing your request"));
            }
        }
    }
}

