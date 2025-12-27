using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Services;
using CRMSys.Application.Utils;
using CRMSys.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller quản lý Customer (CRM Customers management) với CRUD và query nâng cao
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/customers")]
    public class CustomerController : ControllerBase
    {
        private readonly ICustomerService _customerService;

        /// <summary>
        /// Init CustomerController
        /// </summary>
        public CustomerController(ICustomerService customerService)
        {
            _customerService = customerService;
        }

        /// <summary>
        /// Query customers với pagination, filtering, ordering, top N và field selection.
        /// Sử dụng query parameters cho simple filters và domain filters.
        /// </summary>
        /// <param name="request">Customer query request với các tham số filtering</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of customers</returns>
        /// <response code="200">Successfully returned List of customers</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<CustomerResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetCustomers(
            [FromQuery] CustomerQueryRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetCustomers - Processing GET request with query parameters");

                // Validate input parameters for GET
                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (request.Top.HasValue && request.Top.Value < 0)
                    return BadRequest(ApiResponse<string>.Fail("Top value must be non-negative"));

                Log.Information("Query - Executing customers query with request: {@Request}", request);
                var result = await _customerService.QueryAsync(request, ct);

                Log.Information("GetCustomers - Retrieved page {Page}. Total records: {TotalCount}",
                    request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<CustomerResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of customers successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("GetCustomers - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetCustomers - Error querying customers");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying customers: {ex.Message}"));
            }
        }

        /// <summary>
        /// Query customers with advanced domain filter (JSON expression) và field selection.
        /// Sử dụng CustomerQueryRequest trong body để truyền domain filter và fields.
        /// </summary>
        /// <param name="sortColumn">Column name to sort by</param>
        /// <param name="sortOrder">Sort order: asc or desc (default: asc)</param>
        /// <param name="requestTemp"></param>
        /// <param name="body">Domain filter wrapper containing filter conditions</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of customers</returns>
        /// <response code="200">Successfully returned List of customers</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost("query-domain")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<CustomerResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> QueryWithDomain(
            [FromQuery] CustomerQueryRequest requestTemp,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] CustomerDomainQueryWrapper? body = null,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("QueryWithDomain - Starting domain query");

                // Validate pagination
                if (requestTemp.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (requestTemp.PageSize < 1 || requestTemp.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (!string.IsNullOrEmpty(sortOrder) &&
                    !sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase) &&
                    !sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase))
                {
                    return BadRequest(ApiResponse<string>.Fail("Sort order must be either 'asc' or 'desc'"));
                }

                // Build CustomerQueryRequest from query params and body filters
                var request = new CustomerQueryRequest
                {
                    Page = requestTemp.Page,
                    PageSize = requestTemp.PageSize,
                    Name = requestTemp.Name,
                    Email = requestTemp.Email,
                    Type = requestTemp.Type,
                    OwnerId = requestTemp.OwnerId,
                    Country = requestTemp.Country,
                    Industry = requestTemp.Industry,
                };

                // Map sort column from client (camelCase) to database (PascalCase)
                if (!string.IsNullOrWhiteSpace(sortColumn))
                {
                    var field = sortColumn.Trim();
                    var orderBy = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase)
                        ? $"-{field}"
                        : field;
                    request.OrderBy = orderBy;
                }

                // Map filter columns from client (camelCase) to database (PascalCase)
                var filters = body?.Request?.Filters;
                if (filters != null && filters.Any())
                {
                    // Use generic filter processor instead of hardcoded switch
                    FieldMapper.ProcessFilters(filters, request);
                }

                Log.Information("QueryWithDomain - Executing domain query with mapped request: {@Request}", request);
                var result = await _customerService.QueryAsync(request, ct);

                Log.Information("QueryWithDomain - Retrieved page {Page}. Total records: {TotalCount}", request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<CustomerResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of customers successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("QueryWithDomain - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "QueryWithDomain - Error querying customers with domain filter");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying customers: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get customer by ID
        /// </summary>
        /// <param name="id">Customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>customer</returns>
        /// <response code="200">Successfully returned customer details</response>
        /// <response code="404">customer</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<CustomerResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetById - Starting request for id: {Id}", id);

                var customer = await _customerService.GetByIdAsync(id, ct);
                if (customer == null)
                {
                    Log.Warning("GetById - Customer not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Customer with ID {id} was not found"));
                }

                Log.Information("GetById - Successfully retrieved customer with id: {Id}", id);
                return Ok(ApiResponse<CustomerResponse>.Ok(customer, "Get customer successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetById - Error retrieving customer with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the customer: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy deal theo Customer
        /// </summary>
        /// <param name="customerId">Customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of deals của customer</returns>
        /// <response code="200">Successfully returned List of deals</response>
        /// <response code="404">deals cho customer</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{customerId:long}/deals")]
        [ProducesResponseType(typeof(ApiResponse<DealResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetDealsByCustomer(long customerId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetDealsByCustomer - Starting request for customer: {CustomerId}", customerId);

                var deals = await _customerService.GetDealsByCustomerAsync(customerId, ct);
                if (deals == null)
                {
                    Log.Warning("GetDealsByCustomer - Deal not found for customer: {CustomerId}", customerId);
                    return NotFound(ApiResponse<string>.Fail($"Deal with ID {customerId} was not found"));
                }
                Log.Information("GetDealsByCustomer - Successfully retrieved deal with customer id: {CustomerId}", customerId);
                return Ok(ApiResponse<IEnumerable<DealResponse>>.Ok(deals!, "Get deal successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetDealsByCustomer - Error retrieving deal with customer id: {CustomerId}", customerId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the deal: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy lead theo Customer
        /// </summary>
        /// <param name="customerId">Customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of leads của customer</returns>
        /// <response code="200">Successfully returned List of leads</response>
        /// <response code="404">leads cho customer</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{customerId:long}/leads")]
        [ProducesResponseType(typeof(ApiResponse<LeadResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetLeadsByCustomer(long customerId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetLeadsByCustomer - Starting request for customer: {CustomerId}", customerId);

                var leads = await _customerService.GetLeadsByCustomerAsync(customerId, ct);
                if (leads == null)
                {
                    Log.Warning("GetLeadsByCustomer - Lead not found for customer: {CustomerId}", customerId);
                    return NotFound(ApiResponse<string>.Fail($"Lead with ID {customerId} was not found"));
                }

                Log.Information("GetLeadsByCustomer - Successfully retrieved Lead with customer id: {CustomerId}", customerId);
                return Ok(ApiResponse<IEnumerable<LeadResponse>>.Ok(leads!, "Get leads successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetLeadsByCustomer - Error retrieving leads with customer id: {CustomerId}", customerId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the lead: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy activities theo Customer
        /// </summary>
        /// <param name="customerId">Customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of activities của customer</returns>
        /// <response code="200">Successfully returned List of activities</response>
        /// <response code="404">activities cho customer</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{customerId:long}/activities")]
        [ProducesResponseType(typeof(ApiResponse<ActivityResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetActivitiesByCustomer(long customerId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetActivitiesByCustomer - Starting request for customer: {CustomerId}", customerId);

                var activities = await _customerService.GetActivitiesByCustomerAsync(customerId, ct);
                if (activities == null)
                {
                    Log.Warning("GetActivitiesByCustomer - Activities not found for customer: {CustomerId}", customerId);
                    return NotFound(ApiResponse<string>.Fail($"Activities with ID {customerId} was not found"));
                }

                Log.Information("GetActivitiesByCustomer - Successfully retrieved activities with customer id: {CustomerId}", customerId);
                return Ok(ApiResponse<IEnumerable<ActivityResponse>>.Ok(activities!, "Get activities successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetActivitiesByCustomer - Error retrieving activities with customer id: {CustomerId}", customerId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the activities: {ex.Message}"));
            }
        }

        /// <summary>
        /// Lấy contacts theo Customer
        /// </summary>
        /// <param name="customerId">Customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of contacts của customer</returns>
        /// <response code="200">Successfully returned List of contacts</response>
        /// <response code="404">contacts cho customer</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{customerId:long}/contacts")]
        [ProducesResponseType(typeof(ApiResponse<ContactResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetContactsByCustomer(long customerId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetContactsByCustomer - Starting request for customer: {CustomerId}", customerId);

                var contacts = await _customerService.GetContactsByCustomerAsync(customerId, ct);
                if (contacts == null)
                {
                    Log.Warning("GetContactsByCustomer - Contacts not found for customer: {CustomerId}", customerId);
                    return NotFound(ApiResponse<string>.Fail($"Contacts with customer ID {customerId} was not found"));
                }

                Log.Information("GetContactsByCustomer - Successfully retrieved contacts with customer id: {CustomerId}", customerId);
                return Ok(ApiResponse<IEnumerable<ContactResponse>>.Ok(contacts!, "Get contacts successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetContactsByCustomer - Error retrieving contacts with customer id: {CustomerId}", customerId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the contacts: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new customer
        /// </summary>
        /// <param name="request">customer information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created customer</returns>
        /// <response code="201">Successfully created customer, returns ID</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Create([FromBody] CreateCustomerRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Create - Starting customer creation");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _customerService.CreateAsync(request, userEmail, ct);

                Log.Information("Create - Successfully created customer with id: {Id}", id);
                return CreatedAtAction(nameof(GetById), new { id },
                    ApiResponse<long>.Ok(id, "Customer created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Create - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Create - Error creating customer");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to create customer: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update customer
        /// </summary>
        /// <param name="id">Customer ID to update</param>
        /// <param name="request">customer information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update customer thành công</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="404">customer</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateCustomerRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Update - Starting customer update for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _customerService.UpdateAsync(id, request, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Update - Customer not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Customer with ID {id} was not found"));
                }

                Log.Information("Update - Successfully updated customer with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Customer updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Update - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Update - Error updating customer with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to update customer: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete customer
        /// </summary>
        /// <param name="id">Customer ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete customer thành công</response>
        /// <response code="404">customer</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Delete - Starting customer deletion for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _customerService.DeleteAsync(id, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Delete - Customer not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Customer with ID {id} was not found"));
                }

                Log.Information("Delete - Successfully deleted customer with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Customer deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Delete - Error deleting customer with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete customer: {ex.Message}"));
            }
        }
    }
}
