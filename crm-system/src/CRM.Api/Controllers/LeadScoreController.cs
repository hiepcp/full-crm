using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for Lead Score Rule management - simplified single-table design
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/lead-score")]
    public class LeadScoreController : ControllerBase
    {
        private readonly ILeadScoreService _leadScoreService;

        /// <summary>
        /// Constructor
        /// </summary>
        public LeadScoreController(ILeadScoreService leadScoreService)
        {
            _leadScoreService = leadScoreService;
        }

        #region Rule CRUD Endpoints

        /// <summary>
        /// Get all lead score rules
        /// </summary>
        [HttpGet("rules")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<LeadScoreRuleResponse>>), 200)]
        public async Task<IActionResult> GetAllRules(CancellationToken ct = default)
        {
            try
            {
                var rules = await _leadScoreService.GetAllRulesAsync(ct);
                return Ok(ApiResponse<IEnumerable<LeadScoreRuleResponse>>.Ok(
                    rules,
                    "Retrieved all lead score rules successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error fetching all rules");
                return StatusCode(500, ApiResponse<string>.Fail("Failed to fetch rules"));
            }
        }

        /// <summary>
        /// Get active lead score rules only
        /// </summary>
        [HttpGet("rules/active")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<LeadScoreRuleResponse>>), 200)]
        public async Task<IActionResult> GetActiveRules(CancellationToken ct = default)
        {
            try
            {
                var rules = await _leadScoreService.GetActiveRulesAsync(ct);
                return Ok(ApiResponse<IEnumerable<LeadScoreRuleResponse>>.Ok(
                    rules,
                    "Retrieved active lead score rules successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error fetching active rules");
                return StatusCode(500, ApiResponse<string>.Fail("Failed to fetch active rules"));
            }
        }

        /// <summary>
        /// Get lead score rule by ID
        /// </summary>
        [HttpGet("rules/{id}")]
        [ProducesResponseType(typeof(ApiResponse<LeadScoreRuleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        public async Task<IActionResult> GetRuleById(long id, CancellationToken ct = default)
        {
            try
            {
                var rule = await _leadScoreService.GetRuleByIdAsync(id, ct);
                if (rule == null)
                {
                    return NotFound(ApiResponse<string>.Fail($"Rule with ID {id} not found"));
                }

                return Ok(ApiResponse<LeadScoreRuleResponse>.Ok(rule, "Rule retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error fetching rule {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail("Failed to fetch rule"));
            }
        }

        /// <summary>
        /// Create new lead score rule
        /// </summary>
        [HttpPost("rules")]
        [ProducesResponseType(typeof(ApiResponse<LeadScoreRuleResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        public async Task<IActionResult> CreateRule([FromBody] CreateLeadScoreRuleRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = User?.Claims.FirstOrDefault(c => c.Type == "email")?.Value ?? "system@crm.com";
                var rule = await _leadScoreService.CreateRuleAsync(request, userEmail, ct);

                return CreatedAtAction(
                    nameof(GetRuleById),
                    new { id = rule.Id },
                    ApiResponse<LeadScoreRuleResponse>.Ok(rule, "Rule created successfully"));
            }
            catch (InvalidOperationException ex)
            {
                Log.Warning(ex, "Validation error creating rule");
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating rule");
                return StatusCode(500, ApiResponse<string>.Fail("Failed to create rule"));
            }
        }

        /// <summary>
        /// Update existing lead score rule
        /// </summary>
        [HttpPut("rules/{id}")]
        [ProducesResponseType(typeof(ApiResponse<LeadScoreRuleResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        public async Task<IActionResult> UpdateRule(long id, [FromBody] UpdateLeadScoreRuleRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = User?.Claims.FirstOrDefault(c => c.Type == "email")?.Value ?? "system@crm.com";
                var rule = await _leadScoreService.UpdateRuleAsync(id, request, userEmail, ct);

                return Ok(ApiResponse<LeadScoreRuleResponse>.Ok(rule, "Rule updated successfully"));
            }
            catch (KeyNotFoundException ex)
            {
                Log.Warning(ex, "Rule {Id} not found", id);
                return NotFound(ApiResponse<string>.Fail(ex.Message));
            }
            catch (InvalidOperationException ex)
            {
                Log.Warning(ex, "Validation error updating rule");
                return BadRequest(ApiResponse<string>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating rule {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail("Failed to update rule"));
            }
        }

        /// <summary>
        /// Delete lead score rule (soft delete)
        /// </summary>
        [HttpDelete("rules/{id}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        public async Task<IActionResult> DeleteRule(long id, CancellationToken ct = default)
        {
            try
            {
                var result = await _leadScoreService.DeleteRuleAsync(id, ct);
                if (!result)
                {
                    return NotFound(ApiResponse<string>.Fail($"Rule with ID {id} not found"));
                }

                return Ok(ApiResponse<string>.Ok("Rule deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting rule {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail("Failed to delete rule"));
            }
        }

        #endregion
    }
}
