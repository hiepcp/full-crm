using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Dtos.Teams;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Sales Teams and Team Members
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/teams")]
    public class SalesTeamsController : ControllerBase
    {
        private readonly ISalesTeamService _salesTeamService;

        /// <summary>
        /// Init SalesTeamsController
        /// </summary>
        /// <param name="salesTeamService"></param>
        public SalesTeamsController(ISalesTeamService salesTeamService)
        {
            _salesTeamService = salesTeamService;
        }

        /// <summary>
        /// Query teams with pagination and filtering
        /// </summary>
        /// <param name="request">Team query parameters</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of teams</returns>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<TeamResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetTeams([FromQuery] QueryTeamsRequest request, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetTeams - Processing GET request with query parameters");

                if (request.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (request.PageSize < 1 || request.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                var result = await _salesTeamService.QueryAsync(request, ct);

                return Ok(ApiResponse<PagedResult<TeamResponse>>.Ok(
                    result,
                    $"Retrieved page {request.Page} of teams successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("GetTeams - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetTeams - Error querying teams");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while querying teams: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get team by ID
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Team details</returns>
        [HttpGet("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<TeamResponse>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetTeam(long id, CancellationToken ct = default)
        {
            try
            {
                var team = await _salesTeamService.GetByIdAsync(id, ct);
                if (team == null)
                    return NotFound(ApiResponse<string>.Fail($"Team with ID {id} not found"));

                return Ok(ApiResponse<TeamResponse>.Ok(team, "Team retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetTeam - Error getting team {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving team: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new team
        /// </summary>
        /// <param name="request">Team creation data</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Created team ID</returns>
        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = User.FindFirst("email")?.Value ?? "unknown@example.com"; // Get from JWT

                var teamId = await _salesTeamService.CreateAsync(request, userEmail, ct);

                return CreatedAtAction(nameof(GetTeam), new { id = teamId },
                    ApiResponse<long>.Ok(teamId, "Team created successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("CreateTeam - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "CreateTeam - Error creating team");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while creating team: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get team members
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="query">Query parameters</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Team members</returns>
        [HttpGet("{id:long}/members")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<TeamMemberResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<TeamMemberResponse>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetTeamMembers(long id, [FromQuery] TeamMemberQueryRequest query, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetTeamMembers - Processing GET request for team {Id}", id);

                var result = await _salesTeamService.GetTeamMembersAsync(id, query, ct);

                return Ok(ApiResponse<PagedResult<TeamMemberResponse>>.Ok(
                    result,
                    $"Retrieved team members successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetTeamMembers - Error getting members for team {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving team members: {ex.Message}");
            }
        }

        /// <summary>
        /// Add team member
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="request">Member data</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Added member</returns>
        [HttpPost("{id:long}/members")]
        [ProducesResponseType(typeof(ApiResponse<TeamMemberResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> AddTeamMember(long id, [FromBody] TeamMemberRequest request, CancellationToken ct = default)
        {
            try
            {
                Log.Information("AddTeamMember - Adding member to team {Id}", id);

                var member = await _salesTeamService.AddMemberAsync(id, request, ct);
                if (member == null)
                    return BadRequest(ApiResponse<string>.Fail("User is already a member of this team"));

                return CreatedAtAction(nameof(GetTeam), new { id = member.Id },
                    ApiResponse<TeamMemberResponse>.Ok(member, "Team member added successfully");
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("AddTeamMember - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "AddTeamMember - Error adding member to team {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while adding team member: {ex.Message}");
            }
        }

        /// <summary>
        /// Update team member role
        /// </summary>
        /// <param name="teamId">Team ID</param>
        /// <param name="userEmail">User email</param>
        /// <param name="request">Role update data</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        [HttpPut("{teamId:long}/members/{userEmail}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> UpdateTeamMemberRole(long teamId, string userEmail, [FromBody] UpdateTeamMemberRequest request, CancellationToken ct = default)
        {
            try
            {
                Log.Information("UpdateTeamMemberRole - Updating role for user {UserEmail} in team {TeamId}", teamId);

                var success = await _salesTeamService.UpdateMemberRoleAsync(teamId, userEmail, request, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail("Team member not found"));

                return Ok(ApiResponse<string>.Ok("Team member role updated successfully");
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("UpdateTeamMemberRole - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "UpdateTeamMemberRole - Error updating member role: {TeamId}, {UserEmail}", teamId, userEmail);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while updating team member role: {ex.Message}");
            }
        }

        /// <summary>
        /// Remove team member
        /// </summary>
        /// <param name="teamId">Team ID</param>
        /// <param name="userEmail">User email</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Remove result</returns>
        [HttpDelete("{teamId:long}/members/{userEmail}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> RemoveTeamMember(long teamId, string userEmail, CancellationToken ct = default)
        {
            try
            {
                Log.Information("RemoveTeamMember - Removing member {UserEmail} from team {TeamId}", teamId, userEmail);

                var success = await _salesTeamService.RemoveMemberAsync(teamId, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail("Team member not found"));

                return Ok(ApiResponse<string>.Ok("Team member removed successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "RemoveTeamMember - Error removing member from team {TeamId}, {UserEmail}", teamId, userEmail);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while removing team member: {ex.Message}");
            }
        }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("UpdateTeam - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "UpdateTeam - Error updating team {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while updating team: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete team
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Delete result</returns>
        [HttpDelete("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> DeleteTeam(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = User.FindFirst("email")?.Value ?? "unknown@example.com";

                var success = await _salesTeamService.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return BadRequest(ApiResponse<string>.Fail("Cannot delete team with members"));

                return Ok(ApiResponse<string>.Ok("Team deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "DeleteTeam - Error deleting team {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while deleting team: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get team members
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="query">Query parameters</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Team members</returns>
        [HttpGet("{id:long}/members")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<TeamMemberResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetTeamMembers(long id, [FromQuery] TeamMemberQueryRequest query, CancellationToken ct = default)
        {
            try
            {
                if (query.Page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (query.PageSize < 1 || query.PageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                var result = await _salesTeamService.GetTeamMembersAsync(id, query, ct);

                return Ok(ApiResponse<PagedResult<TeamMemberResponse>>.Ok(
                    result, "Team members retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetTeamMembers - Error getting members for team {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving team members: {ex.Message}"));
            }
        }

        /// <summary>
        /// Add team member
        /// </summary>
        /// <param name="id">Team ID</param>
        /// <param name="request">Member data</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Added member</returns>
        [HttpPost("{id:long}/members")]
        [ProducesResponseType(typeof(ApiResponse<TeamMemberResponse>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> AddTeamMember(long id, [FromBody] TeamMemberRequest request, CancellationToken ct = default)
        {
            try
            {
                var member = await _salesTeamService.AddMemberAsync(id, request, ct);
                if (member == null)
                    return BadRequest(ApiResponse<string>.Fail("User is already a member of this team"));

                return Created("", ApiResponse<TeamMemberResponse>.Ok(member, "Team member added successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("AddTeamMember - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "AddTeamMember - Error adding member to team {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while adding team member: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update team member role
        /// </summary>
        /// <param name="teamId">Team ID</param>
        /// <param name="userEmail">User email</param>
        /// <param name="request">Role update data</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        [HttpPut("{teamId:long}/members/{userEmail}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> UpdateTeamMemberRole(long teamId, string userEmail, [FromBody] UpdateTeamMemberRequest request, CancellationToken ct = default)
        {
            try
            {
                var success = await _salesTeamService.UpdateMemberRoleAsync(teamId, userEmail, request, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail("Team member not found"));

                return Ok(ApiResponse<string>.Ok("Team member role updated successfully"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                Log.Warning("UpdateTeamMemberRole - Validation failed: {Message}", vex.Message);
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "UpdateTeamMemberRole - Error updating member role for team {TeamId}, user {UserEmail}", teamId, userEmail);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while updating team member role: {ex.Message}"));
            }
        }

        /// <summary>
        /// Remove team member
        /// </summary>
        /// <param name="teamId">Team ID</param>
        /// <param name="userEmail">User email</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Remove result</returns>
        [HttpDelete("{teamId:long}/members/{userEmail}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> RemoveTeamMember(long teamId, string userEmail, CancellationToken ct = default)
        {
            try
            {
                var success = await _salesTeamService.RemoveMemberAsync(teamId, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail("Team member not found"));

                return Ok(ApiResponse<string>.Ok("Team member removed successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "RemoveTeamMember - Error removing member from team {TeamId}, user {UserEmail}", teamId, userEmail);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while removing team member: {ex.Message}"));
            }
        }
    }
}