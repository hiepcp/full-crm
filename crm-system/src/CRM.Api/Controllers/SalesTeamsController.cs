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
    [Authorize]
    [ApiController]
    [Route("api/teams")]
    public class SalesTeamsController : ControllerBase
    {
        private readonly ISalesTeamService _salesTeamService;

        public SalesTeamsController(ISalesTeamService salesTeamService)
        {
            _salesTeamService = salesTeamService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<TeamResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetTeams([FromQuery] QueryTeamsRequest request, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetTeams - Processing GET request");

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

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<long>), 201)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = User.FindFirst("email")?.Value ?? "unknown@example.com";

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

        [HttpPut("{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> UpdateTeam(long id, [FromBody] UpdateTeamRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = User.FindFirst("email")?.Value ?? "unknown@example.com";

                var success = await _salesTeamService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"Team with ID {id} not found"));

                return Ok(ApiResponse<string>.Ok("Team updated successfully"));
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

        [HttpGet("{id:long}/members")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<TeamMemberResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetTeamMembers(long id, [FromQuery] TeamMemberQueryRequest query, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetTeamMembers - Processing GET request for team {Id}", id);

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

        [HttpPut("{teamId:long}/members/{userEmail}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> UpdateTeamMemberRole(long teamId, string userEmail, [FromBody] UpdateTeamMemberRequest request, CancellationToken ct = default)
        {
            try
            {
                Log.Information("UpdateTeamMemberRole - Updating role for user {UserEmail} in team {TeamId}", userEmail, teamId);

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

        [HttpDelete("{teamId:long}/members/{userEmail}")]
        [ProducesResponseType(typeof(ApiResponse<string>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> RemoveTeamMember(long teamId, string userEmail, CancellationToken ct = default)
        {
            try
            {
                Log.Information("RemoveTeamMember - Removing member {UserEmail} from team {TeamId}", userEmail, teamId);

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
