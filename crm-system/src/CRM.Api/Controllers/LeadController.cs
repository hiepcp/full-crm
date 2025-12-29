using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Utils;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Leads (CRM Leads management) with CRUD and advanced query
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/leads")]
    public class LeadController : ControllerBase
    {
        private readonly ILeadService _leadService;

        /// <summary>
        /// Init LeadController
        /// </summary>
        /// <param name="leadService"></param>
        public LeadController(ILeadService leadService)
        {
            _leadService = leadService;
        }

        /// <summary>
        /// Create lead from public form (no authentication required)
        /// Simplified endpoint for external lead generation
        /// </summary>
        /// <param name="request">Public lead data</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created lead</returns>
        /// <response code="201">Successfully created lead</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error</response>
        [AllowAnonymous]
        [HttpPost("public")]
        [ProducesResponseType(typeof(ApiResponse<object>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> CreatePublicLead([FromBody] CreateLeadRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Lead data is required"));

            try
            {
                Log.Information("CreatePublicLead - Starting public lead creation");

                // Set default values for public leads
                request.Status = null;
                request.Source = null;
                request.Type = 0; // Draft - from public form
                
                // Use system user for public submissions
                var userEmail = "public-form@crm.com";
                var leadId = await _leadService.CreateDraftAsync(request, userEmail, ct);

                var payload = new { leadId };
                Log.Information("CreatePublicLead - Successfully created lead {LeadId} from public form", leadId);
                
                return CreatedAtAction(nameof(GetById), new { id = leadId }, 
                    ApiResponse<object>.Ok(payload, "Your information has been submitted successfully. We will contact you soon."));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("CreatePublicLead - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "CreatePublicLead - Error creating public lead");
                return StatusCode(500, ApiResponse<string>.Fail($"Failed to submit your request: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create lead WITH initial activity (required) in a single transaction.
        /// </summary>
        /// <param name="request">Lead and activity data to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created lead and activity</returns>
        /// <response code="201">Successfully created lead and activity</response>
        /// <response code="400">Invalid request or missing activity</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost("with-activity")]
        [ProducesResponseType(typeof(ApiResponse<object>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> CreateWithActivity([FromBody] CreateLeadWithActivityRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            if (request.Activity == null)
                return BadRequest(ApiResponse<string>.Fail("Validation failed: -- Activity: Initial activity is required."));

            try
            {
                Log.Information("CreateWithActivity - Starting lead + activity creation");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var (leadId, activityId) = await _leadService.CreateWithActivityAsync(request, userEmail, ct);

                var payload = new { leadId, activityId };
                return CreatedAtAction(nameof(GetById), new { id = leadId }, ApiResponse<object>.Ok(payload, "Lead and activity created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("CreateWithActivity - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "CreateWithActivity - Error creating lead with activity");
                return StatusCode(500, ApiResponse<string>.Fail($"Failed to create lead with activity: {ex.Message}"));
            }
        }

        /// <summary>
        /// Query leads với pagination, filtering, ordering, top N và field selection.
        /// Sử dụng query parameters cho simple filters và domain filters.
        /// Ví dụ: ?status=new&amp;fields=id,first_name,email&amp;page=1&amp;pageSize=20&amp;domain={"status":"new"}
        /// </summary>
        /// <param name="request">Lead query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of leads</returns>
        /// <response code="200">Successfully returned List of leads</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        //[Authorize(Policy = "Lead.Read")]
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<LeadResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetLeads(
            [FromQuery] LeadQueryRequest request,
            CancellationToken ct = default)
        {
            try
            {
                // GET request - parse query parameters
                Log.Information("GetLeads - Processing GET request with query parameters");

                // Validate input parameters for GET
                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                if (request.Top.HasValue && request.Top.Value < 0)
                    return BadRequest(ApiResponse<string>.Fail("Top value must be non-negative"));

                Log.Information("Query - Executing leads query with request: {@Request}", request);
                var result = await _leadService.QueryAsync(request, ct);

                Log.Information("GetLeads - Retrieved page {Page}. Total records: {TotalCount}",
                    request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<LeadResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of leads successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("GetLeads - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetLeads - Error querying leads");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying leads: {ex.Message}"));
            }
        }

        /// <summary>
        /// Query leads with advanced domain filter (JSON expression) và field selection.
        /// Sử dụng LeadQueryRequest trong body để truyền domain filter và fields.
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Records per page (default: 10, max: 100)</param>
        /// <param name="sortColumn">Column name to sort by</param>
        /// <param name="sortOrder">Sort order: asc or desc (default: asc)</param>
        /// <param name="type">Lead type filter: 0=Draft, 1=Active (optional)</param>
        /// <param name="body">Domain filter wrapper containing filter conditions</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of leads</returns>
        /// <response code="200">Successfully returned List of leads</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [Authorize(Policy = "Lead.Read")]
        [HttpPost("query-domain")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<LeadResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> QueryWithDomain(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromQuery] int? type = null,
            [FromBody] LeadDomainQueryWrapper? body = null,
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

                // Build LeadQueryRequest from query params and body filters
                
                var request = new LeadQueryRequest
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
                    // Use generic filter processor instead of hardcoded switch
                    FieldMapper.ProcessFilters(filters, request);
                }

                // Add Type filter if specified
                if (type.HasValue)
                {
                    request.Type = type.Value;
                    Log.Information("QueryWithDomain - Filtering by Type: {Type}", type.Value);
                }

                Log.Information("QueryWithDomain - Executing domain query with mapped request: {@Request}", request);
                var result = await _leadService.QueryAsync(request, ct);

                Log.Information("QueryWithDomain - Retrieved page {Page}. Total records: {TotalCount}", request.Page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<LeadResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of leads successfully. Total records: {result.TotalCount}"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("QueryWithDomain - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "QueryWithDomain - Error querying leads with domain filter");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying leads: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get lead by ID
        /// </summary>
        /// <param name="id">Lead ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>lead</returns>
        /// <response code="200">Successfully returned lead details</response>
        /// <response code="404">lead</response>
        /// <response code="500">Server error while processing request</response>
        [Authorize(Policy = "Lead.Read")]
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<LeadResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetById - Starting request for id: {Id}", id);

                var lead = await _leadService.GetByIdAsync(id, ct);
                if (lead == null)
                {
                    Log.Warning("GetById - Lead not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Lead with ID {id} was not found"));
                }

                Log.Information("GetById - Successfully retrieved lead with id: {Id}", id);
                return Ok(ApiResponse<LeadResponse>.Ok(lead, "Get lead successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetById - Error retrieving lead with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the lead: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new lead
        /// </summary>
        /// <param name="request">lead information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created lead</returns>
        /// <response code="201">Successfully created lead, returns ID</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="500">Server error while processing request</response>
        [Authorize(Policy = "Lead.Create")]
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Create([FromBody] CreateLeadRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Create - Starting lead creation");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _leadService.CreateAsync(request, userEmail, ct);

                Log.Information("Create - Successfully created lead with id: {Id}", id);
                return CreatedAtAction(nameof(GetById), new { id },
                    ApiResponse<long>.Ok(id, "Lead created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Create - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Create - Error creating lead");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to create lead: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update lead
        /// </summary>
        /// <param name="id">Lead ID to update</param>
        /// <param name="request">lead information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update lead thành công</response>
        /// <response code="400">Invalid request or validation failed</response>
        /// <response code="404">lead</response>
        /// <response code="500">Server error while processing request</response>
        [Authorize(Policy = "Lead.Update")]
        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateLeadRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("Update - Starting lead update for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _leadService.UpdateAsync(id, request, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Update - Lead not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Lead with ID {id} was not found"));
                }

                Log.Information("Update - Successfully updated lead with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Lead updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("Update - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Update - Error updating lead with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to update lead: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete lead
        /// </summary>
        /// <param name="id">Lead ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete lead thành công</response>
        /// <response code="404">lead</response>
        /// <response code="500">Server error while processing request</response>
        [Authorize(Policy = "Lead.Delete")]
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Delete - Starting lead deletion for id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _leadService.DeleteAsync(id, userEmail, ct);

                if (!success)
                {
                    Log.Warning("Delete - Lead not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Lead with ID {id} was not found"));
                }

                Log.Information("Delete - Successfully deleted lead with id: {Id}", id);
                return Ok(ApiResponse<string>.Ok("", "Lead deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Delete - Error deleting lead with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete lead: {ex.Message}"));
            }
        }

        /// <summary>
        /// Convert lead to deal with customer and contact creation
        /// </summary>
        [HttpPost("{id:long}/convert-to-deal")]
        [ProducesResponseType(typeof(ApiResponse<long>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> ConvertToDeal(long id, [FromBody] ConvertLeadToDealRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                Log.Information("ConvertToDeal - Starting lead to deal conversion for lead id: {Id}", id);

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var dealId = await _leadService.ConvertLeadToDealAsync(id, request, ct);

                Log.Information("ConvertToDeal - Successfully converted lead {LeadId} to deal {DealId}", id, dealId);
                return Ok(ApiResponse<long>.Ok(dealId, $"Lead {id} successfully converted to deal {dealId}"));
            }
            catch (KeyNotFoundException ex)
            {
                Log.Warning("ConvertToDeal - Lead not found for id: {Id}", id);
                return NotFound(ApiResponse<string>.Fail(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                Log.Warning("ConvertToDeal - Business rule violation: {Message}", ex.Message);
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("ConvertToDeal - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "ConvertToDeal - Error converting lead {Id} to deal", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to convert lead to deal: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create address for lead (stored in crm_lead_address)
        /// </summary>
        [HttpPost("~/api/addresses")]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> CreateLeadAddress([FromBody] CreateLeadAddressRequest request, CancellationToken ct = default)
        {
            if (request == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _leadService.CreateLeadAddressAsync(request, userEmail, ct);
                return Created(string.Empty, ApiResponse<long>.Ok(id, "Lead address created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("CreateLeadAddress - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "CreateLeadAddress - Error creating lead address");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to create lead address: {ex.Message}"));
            }
        }

        /// <summary>
        /// Activate draft lead - Convert Type from 0 (Draft) to 1 (Active)
        /// </summary>
        /// <param name="id">Lead ID to activate</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Activation result</returns>
        /// <response code="200">Successfully activated draft lead</response>
        /// <response code="404">Lead not found</response>
        /// <response code="400">Lead is already active</response>
        /// <response code="500">Server error</response>
        [Authorize(Policy = "Lead.Update")]
        [HttpPost("{id:long}/activate")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> ActivateDraftLead(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("ActivateDraftLead - Starting activation for lead id: {Id}", id);

                var lead = await _leadService.GetByIdAsync(id, ct);
                if (lead == null)
                {
                    Log.Warning("ActivateDraftLead - Lead not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Lead with ID {id} was not found"));
                }

                if (lead.Type != 0)
                {
                    Log.Warning("ActivateDraftLead - Lead {Id} is already active (Type={Type})", id, lead.Type);
                    return BadRequest(ApiResponse<string>.Fail($"Lead {id} is already active"));
                }

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var updateRequest = new UpdateLeadRequest
                {
                    Email = lead.Email,
                    TelephoneNo = lead.TelephoneNo,
                    FirstName = lead.FirstName,
                    LastName = lead.LastName,
                    Company = lead.Company,
                    Website = lead.Website,
                    Country = lead.Country,
                    VatNumber = lead.VatNumber,
                    PaymentTerms = lead.PaymentTerms,
                    Source = lead.Source ?? "web",
                    Status = lead.Status ?? "working",
                    Type = 1, // Activate: Draft (0) -> Active (1)
                    OwnerId = lead.OwnerId,
                    Score = lead.Score,
                    Note = lead.Note,
                    FollowUpDate = lead.FollowUpDate
                };

                var success = await _leadService.UpdateAsync(id, updateRequest, userEmail, ct);
                if (!success)
                {
                    return StatusCode(500, ApiResponse<string>.Fail("Failed to activate lead"));
                }

                Log.Information("ActivateDraftLead - Successfully activated lead {Id}", id);
                return Ok(ApiResponse<string>.Ok("", $"Lead {id} successfully activated"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "ActivateDraftLead - Error activating lead {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to activate lead: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete draft lead (only allows deletion of draft leads with Type=0)
        /// </summary>
        /// <param name="id">Lead ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Successfully deleted draft lead</response>
        /// <response code="404">Lead not found</response>
        /// <response code="400">Cannot delete active lead</response>
        /// <response code="500">Server error</response>
        [Authorize(Policy = "Lead.Delete")]
        [HttpDelete("{id:long}/draft")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> DeleteDraftLead(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("DeleteDraftLead - Starting deletion for lead id: {Id}", id);

                var lead = await _leadService.GetByIdAsync(id, ct);
                if (lead == null)
                {
                    Log.Warning("DeleteDraftLead - Lead not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Lead with ID {id} was not found"));
                }

                if (lead.Type != 0)
                {
                    Log.Warning("DeleteDraftLead - Cannot delete active lead (Type={Type}) with id: {Id}", lead.Type, id);
                    return BadRequest(ApiResponse<string>.Fail($"Cannot delete active lead. Only draft leads can be deleted through this endpoint."));
                }

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _leadService.DeleteAsync(id, userEmail, ct);

                if (!success)
                {
                    return StatusCode(500, ApiResponse<string>.Fail("Failed to delete draft lead"));
                }

                Log.Information("DeleteDraftLead - Successfully deleted draft lead {Id}", id);
                return Ok(ApiResponse<string>.Ok("", $"Draft lead {id} deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "DeleteDraftLead - Error deleting draft lead {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete draft lead: {ex.Message}"));
            }
        }

    }
}
