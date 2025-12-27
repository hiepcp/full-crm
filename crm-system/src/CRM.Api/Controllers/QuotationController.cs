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
    /// Controller for managing Quotations
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/quotations")]
    public class QuotationController : ControllerBase
    {
        private readonly IQuotationService _quotationService;

        /// <summary>
        /// Init
        /// </summary>
        /// <param name="quotationService"></param>
        public QuotationController(IQuotationService quotationService)
        {
            _quotationService = quotationService;
        }

        /// <summary>
        /// Query quotations with pagination and filtering
        /// </summary>
        /// <param name="request">Quotation query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of quotations</returns>
        /// <response code="200">Successfully returned List of quotations</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        public async Task<IActionResult> GetQuotations([FromQuery] QuotationQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _quotationService.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<QuotationResponse>>.Ok(result, "Quotations retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error querying quotations");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get quotation by ID
        /// </summary>
        /// <param name="id">Quotation ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>quotation</returns>
        /// <response code="200">Successfully returned quotation details</response>
        /// <response code="404">quotation</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                var quotation = await _quotationService.GetByIdAsync(id, ct);
                if (quotation == null)
                    return NotFound(ApiResponse<string>.Fail($"Quotation with ID {id} was not found"));

                return Ok(ApiResponse<QuotationResponse>.Ok(quotation, "Quotation retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting quotation by id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new quotation
        /// </summary>
        /// <param name="request">quotation information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created quotation</returns>
        /// <response code="201">Successfully created quotation, returns ID</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateQuotationRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _quotationService.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "Quotation created successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating quotation");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update quotation
        /// </summary>
        /// <param name="id">Quotation ID to update</param>
        /// <param name="request">quotation information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update quotation thành công</response>
        /// <response code="404">quotation</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateQuotationRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _quotationService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Quotation with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Quotation updated successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating quotation with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete quotation
        /// </summary>
        /// <param name="id">Quotation ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete quotation thành công</response>
        /// <response code="404">quotation</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _quotationService.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Quotation with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "Quotation deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting quotation with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }
    }
}
