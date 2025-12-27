using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Services;
using CRMSys.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;
using System.Transactions;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Contacts (CRM Contacts management)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/contacts")]
    public class ContactController : ControllerBase
    {
        private readonly IContactService _contactService;

        /// <summary>
        /// ContactController
        /// </summary>
        /// <param name="contactService"></param>
        public ContactController(IContactService contactService)
        {
            _contactService = contactService;
        }

        /// <summary>
        /// Query contacts with pagination and filtering
        /// </summary>
        /// <param name="request">Contact query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of contacts</returns>
        /// <response code="200">Successfully returned contacts list</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ContactResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetContacts(
            [FromQuery] ContactQueryRequest request,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetContacts - Processing GET request with query parameters");

                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (request.Top.HasValue && request.Top.Value < 0)
                    return BadRequest(ApiResponse<string>.Fail("Top value must be non-negative"));

                Log.Information("Query - Executing contacts query with request: {@Request}", request);
                var result = await _contactService.QueryAsync(request, ct);

                Log.Information("GetContacts - Retrieved page {Page}. Total records: {TotalCount}",
                    request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<ContactResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of contacts successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("GetContacts - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetContacts - Error querying contacts");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying contacts: {ex.Message}"));
            }
        }

        /// <summary>
        /// Query contacts with advanced domain filter (JSON expression) and field selection
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Records per page (default: 10, max: 100)</param>
        /// <param name="sortColumn">Column name to sort by</param>
        /// <param name="sortOrder">Sort order: asc or desc (default: asc)</param>
        /// <param name="body">Domain filter wrapper containing filter conditions</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of contacts</returns>
        /// <response code="200">Successfully returned contacts list</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost("query-domain")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<ContactResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> QueryWithDomain(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] ContactDomainQueryWrapper? body = null,
            CancellationToken ct = default)
        {
            try
            {
                var request = new ContactQueryRequest
                {
                    Page = page,
                    PageSize = pageSize
                };

                // Handle sort - client sends camelCase (e.g., "createdOn")
                // Repository will map to "CreatedOn ASC"
                if (!string.IsNullOrWhiteSpace(sortColumn))
                {
                    var field = sortColumn.Trim();
                    var orderBy = sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase)
                        ? $"-{field}"
                        : field;
                    request.OrderBy = orderBy;
                }

                // Handle filters - client sends camelCase, map to PascalCase
                var filters = body?.Request?.Filters;
                if (filters != null && filters.Any())
                {
                    // Use generic filter processor instead of hardcoded switch
                    FieldMapper.ProcessFilters(filters, request);
                }

                var result = await _contactService.QueryAsync(request);
                return Ok(ApiResponse<PagedResult<ContactResponse>>.Ok(
                    result,
                    $"Retrieved page {page} of contacts successfully. Total records: {result.TotalCount}"
                ));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error in QueryWithDomain for contacts");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get contact by ID
        /// </summary>
        /// <param name="id">Contact ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Contact details</returns>
        /// <response code="200">Successfully returned contact details</response>
        /// <response code="404">Contact not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<ContactResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetById - Starting request for id: {Id}", id);

                var contact = await _contactService.GetByIdAsync(id, ct);
                if (contact == null)
                {
                    Log.Warning("GetById - Contact not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Contact with ID {id} was not found"));
                }

                Log.Information("GetById - Successfully retrieved contact with id: {Id}", id);
                return Ok(ApiResponse<ContactResponse>.Ok(contact, "Get contact successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetById - Error retrieving contact with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the contact: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new contact
        /// </summary>
        /// <param name="request">Contact information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created contact</returns>
        /// <response code="201">Successfully created contact, returns ID</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Create([FromBody] CreateContactRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Create - Starting contact creation");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _contactService.CreateAsync(request, userEmail, ct);

                if (request.IsPrimary)
                {
                    var success = await _contactService.SetAsPrimaryAsync(id, ct);

                    if (!success)
                    {
                        Log.Warning("SetAsPrimary - Contact not found for id: {Id}", id);
                        return NotFound(ApiResponse<string>.Fail($"Contact with ID {id} was not found"));
                    }
                }

                Log.Information("Create - Successfully created contact with id: {Id}", id);
                return CreatedAtAction(nameof(GetById), new { id },
                    ApiResponse<long>.Ok(id, "Contact created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Create - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Create - Error creating contact");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to create contact: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update contact
        /// </summary>
        /// <param name="id">Contact ID to update</param>
        /// <param name="request">Contact information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Successfully updated contact</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="404">Contact not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateContactRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Update - Starting contact update for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _contactService.UpdateAsync(id, request, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Update - Contact not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Contact with ID {id} was not found"));
                }

                Log.Information("Update - Successfully updated contact with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Contact updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Update - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Update - Error updating contact with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to update contact: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete contact
        /// </summary>
        /// <param name="id">Contact ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Successfully deleted contact</response>
        /// <response code="404">Contact not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Delete - Starting contact deletion for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _contactService.DeleteAsync(id, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Delete - Contact not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Contact with ID {id} was not found"));
                }

                Log.Information("Delete - Successfully deleted contact with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Contact deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Delete - Error deleting contact with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete contact: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get deals by Contact
        /// </summary>
        /// <param name="contactId">Contact ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of deals for the contact</returns>
        /// <response code="200">Successfully returned list of deals</response>
        /// <response code="404">No deals found for contact</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{contactId:long}/deals")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<DealResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetDealsByContact(long contactId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetDealsByContact - Starting request for contactId: {ContactId}", contactId);

                var deals = await _contactService.GetDealsByContactAsync(contactId, ct);
                if (deals == null)
                {
                    Log.Warning("GetDealsByContact - No deals found for contactId: {ContactId}", contactId);
                    return NotFound(ApiResponse<string>.Fail($"No deals found for contact with ID {contactId}"));
                }

                Log.Information("GetDealsByContact - Successfully retrieved deals for contactId: {ContactId}", contactId);
                return Ok(ApiResponse<IEnumerable<DealResponse>>.Ok(deals, "Get deals by contact successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetDealsByContact - Error retrieving deals for contactId: {ContactId}", contactId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving deals: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get activities by Contact
        /// </summary>
        /// <param name="contactId">Contact ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of activities for the contact</returns>
        /// <response code="200">Successfully returned list of activities</response>
        /// <response code="404">No activities found for contact</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{contactId:long}/activities")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<ActivityResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetActivitiesByContact(long contactId, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetActivitiesByContact - Starting request for contactId: {ContactId}", contactId);

                var activities = await _contactService.GetActivitiesByContactAsync(contactId, ct);
                if (activities == null)
                {
                    Log.Warning("GetActivitiesByContact - No activities found for contactId: {ContactId}", contactId);
                    return NotFound(ApiResponse<string>.Fail($"No activities found for contact with ID {contactId}"));
                }

                Log.Information("GetActivitiesByContact - Successfully retrieved activities for contactId: {ContactId}", contactId);
                return Ok(ApiResponse<IEnumerable<ActivityResponse>>.Ok(activities, "Get activities by contact successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetActivitiesByContact - Error retrieving activities for contactId: {ContactId}", contactId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving activities: {ex.Message}"));
            }
        }

        /// <summary>
        /// Set contact as primary for its customer
        /// </summary>
        /// <param name="id">Contact ID to set as primary</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Success response</returns>
        /// <response code="200">Successfully set as primary</response>
        /// <response code="404">Contact not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}/set-primary")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> SetAsPrimary(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("SetAsPrimary - Setting contact as primary for id: {Id}", id);

                var success = await _contactService.SetAsPrimaryAsync(id, ct);

                if (!success)
                {
                    Log.Warning("SetAsPrimary - Contact not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Contact with ID {id} was not found"));
                }

                Log.Information("SetAsPrimary - Successfully set contact as primary for id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Contact set as primary successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "SetAsPrimary - Error setting contact as primary for id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to set contact as primary: {ex.Message}"));
            }
        }
    }
}
