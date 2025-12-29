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
    /// Controller for managing Customer Addresses (CRM Customer Addresses management) with CRUD and advanced query
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/customer-addresses")]
    public class CustomerAddressController : ControllerBase
    {
        private readonly ICustomerAddressService _customerAddressService;

        /// <summary>
        /// Init CustomerAddressController
        /// </summary>
        /// <param name="customerAddressService"></param>
        public CustomerAddressController(ICustomerAddressService customerAddressService)
        {
            _customerAddressService = customerAddressService;
        }

        /// <summary>
        /// Query customer addresses với pagination, filtering, ordering, top N và field selection.
        /// Sử dụng query parameters cho simple filters.
        /// </summary>
        /// <param name="request">Customer address query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of customer addresses</returns>
        /// <response code="200">Successfully returned List of customer addresses</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<CustomerAddressResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetCustomerAddresses(
            [FromQuery] CustomerAddressQueryRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetCustomerAddresses - Processing GET request with query parameters");

                // Validate input parameters for GET
                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (request.Top.HasValue && request.Top.Value < 0)
                    return BadRequest(ApiResponse<string>.Fail("Top value must be non-negative"));

                Log.Information("Query - Executing customer addresses query with request: {@Request}", request);
                var result = await _customerAddressService.QueryAsync(request, ct);

                Log.Information("GetCustomerAddresses - Retrieved page {Page}. Total records: {TotalCount}",
                    request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<CustomerAddressResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of customer addresses successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("GetCustomerAddresses - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetCustomerAddresses - Error querying customer addresses");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying customer addresses: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get all addresses for a specific customer
        /// </summary>
        /// <param name="customerId">Customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of addresses của customer</returns>
        /// <response code="200">Successfully returned List of addresses</response>
        /// <response code="404">addresses</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("customer/{customerId:long}")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<CustomerAddressResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetByCustomerId(long customerId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetByCustomerId - Starting request for customerId: {CustomerId}", customerId);

                var addresses = await _customerAddressService.GetByCustomerIdAsync(customerId, ct);
                var addressList = addresses.ToList();

                if (!addressList.Any())
                {
                    Log.Warning("GetByCustomerId - No addresses found for customerId: {CustomerId}", customerId);
                    return Ok(ApiResponse<IEnumerable<CustomerAddressResponse>>.Ok(addressList, "No addresses found for this customer"));
                }

                Log.Information("GetByCustomerId - Successfully retrieved {Count} addresses for customerId: {CustomerId}", addressList.Count, customerId);
                return Ok(ApiResponse<IEnumerable<CustomerAddressResponse>>.Ok(addressList, "Get customer addresses successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetByCustomerId - Error retrieving addresses for customerId: {CustomerId}", customerId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving customer addresses: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get customer address by ID
        /// </summary>
        /// <param name="id">Customer address ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>customer address</returns>
        /// <response code="200">Successfully returned customer address details</response>
        /// <response code="404">customer address</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<CustomerAddressResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetById - Starting request for id: {Id}", id);

                var address = await _customerAddressService.GetByIdAsync(id, ct);
                if (address == null)
                {
                    Log.Warning("GetById - Customer address not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Customer address with ID {id} was not found"));
                }

                Log.Information("GetById - Successfully retrieved customer address with id: {Id}", id);
                return Ok(ApiResponse<CustomerAddressResponse>.Ok(address, "Get customer address successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetById - Error retrieving customer address with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the customer address: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new customer address
        /// </summary>
        /// <param name="request">customer address information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created customer address</returns>
        /// <response code="201">Successfully created customer address, returns ID</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Create([FromBody] CreateCustomerAddressRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Create - Starting customer address creation");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _customerAddressService.CreateAsync(request, userEmail, ct);

                Log.Information("Create - Successfully created customer address with id: {Id}", id);
                return CreatedAtAction(nameof(GetById), new { id },
                    ApiResponse<long>.Ok(id, "Customer address created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Create - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Create - Error creating customer address");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to create customer address: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update customer address
        /// </summary>
        /// <param name="id">Customer address ID to update</param>
        /// <param name="request">customer address information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update customer address thành công</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="404">customer address</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateCustomerAddressRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Update - Starting customer address update for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _customerAddressService.UpdateAsync(id, request, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Update - Customer address not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Customer address with ID {id} was not found"));
                }

                Log.Information("Update - Successfully updated customer address with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Customer address updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Update - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Update - Error updating customer address with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to update customer address: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete customer address
        /// </summary>
        /// <param name="id">Customer address ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete customer address thành công</response>
        /// <response code="404">customer address</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Delete - Starting customer address deletion for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _customerAddressService.DeleteAsync(id, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Delete - Customer address not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Customer address with ID {id} was not found"));
                }

                Log.Information("Delete - Successfully deleted customer address with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Customer address deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Delete - Error deleting customer address with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete customer address: {ex.Message}"));
            }
        }

        /// <summary>
        /// Set address as primary for its type
        /// </summary>
        /// <param name="id">Customer address ID cần set làm primary</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>set primary</returns>
        /// <response code="200">Set primary thành công</response>
        /// <response code="404">customer address</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}/set-primary")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> SetAsPrimary(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("SetAsPrimary - Setting address as primary for id: {Id}", id);

                var success = await _customerAddressService.SetAsPrimaryAsync(id, ct);

                if (!success)
                {
                    Log.Warning("SetAsPrimary - Customer address not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Customer address with ID {id} was not found"));
                }

                Log.Information("SetAsPrimary - Successfully set address as primary for id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Address set as primary successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "SetAsPrimary - Error setting address as primary for id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to set address as primary: {ex.Message}"));
            }
        }
    }
}
