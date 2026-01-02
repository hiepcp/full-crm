using CRMSys.Application.Dtos.Teams;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;
using Serilog;
using System.Text.Json;

namespace CRMSys.Application.Services
{
    public class SalesTeamService : ISalesTeamService
    {
        private readonly ISalesTeamRepository _repository;

        public SalesTeamService(ISalesTeamRepository repository)
        {
            _repository = repository;
        }

        public async Task<PagedResult<TeamResponse>> QueryAsync(QueryTeamsRequest query, CancellationToken ct = default)
        {
            var result = await _repository.QueryAsync(query, ct);

            var items = new List<TeamResponse>();
            foreach (var team in result.Items)
            {
                var memberCount = await _repository.GetMemberCountAsync(team.Id, ct);
                var dealCount = await _repository.GetDealCountAsync(team.Id, ct);
                var customerCount = await _repository.GetCustomerCountAsync(team.Id, ct);

                items.Add(MapToTeamResponse(team, memberCount, dealCount, customerCount));
            }

            return new PagedResult<TeamResponse>
            {
                Items = items,
                TotalCount = result.TotalCount
            };
        }

        public async Task<TeamResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var team = await _repository.GetByIdAsync(id, ct);
            if (team == null) return null;

            var memberCount = await _repository.GetMemberCountAsync(id, ct);
            var dealCount = await _repository.GetDealCountAsync(id, ct);
            var customerCount = await _repository.GetCustomerCountAsync(id, ct);

            return MapToTeamResponse(team, memberCount, dealCount, customerCount);
        }

        public async Task<long> CreateAsync(CreateTeamRequest request, string userEmail, CancellationToken ct = default)
        {
            // Note: User ID should be obtained from userEmail, but for now assume it's passed or get from context
            // For simplicity, assume userId is 1, but in real implementation, get from JWT or user service
            var userId = 1L; // TODO: Get from user context

            var team = new SalesTeam
            {
                Name = request.Name,
                Description = request.Description,
                GroupMail = request.GroupMail,
                CreatedBy = userEmail,
                CreatedOn = DateTime.UtcNow,
                UpdatedBy = userEmail,
                UpdatedOn = DateTime.UtcNow
            };

            var id = await _repository.AddAsync(team, ct);

            // Audit logging
            Log.Information("Team created: {TeamId} by {UserEmail}", id, userEmail);

            return id;
        }

        public async Task<bool> UpdateAsync(long id, UpdateTeamRequest request, string userEmail, CancellationToken ct = default)
        {
            var existing = await _repository.GetByIdAsync(id, ct);
            if (existing == null) return false;

            existing.Name = request.Name ?? existing.Name;
            existing.Description = request.Description ?? existing.Description;
            existing.GroupMail = request.GroupMail ?? existing.GroupMail;
            existing.UpdatedBy = userEmail;
            existing.UpdatedOn = DateTime.UtcNow;

            await _repository.UpdateAsync(existing, ct);

            // Audit logging
            Log.Information("Team updated: {TeamId} by {UserEmail}", id, userEmail);

            return true;
        }

        public async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var memberCount = await _repository.GetMemberCountAsync(id, ct);
            if (memberCount > 0) return false; // Cannot delete team with members

            var result = await _repository.DeleteAsync(id, ct);

            if (result)
            {
                // Audit logging
                Log.Information("Team deleted: {TeamId} by {UserEmail}", id, userEmail);
            }

            return result;
        }

        public async Task<PagedResult<TeamMemberResponse>> GetTeamMembersAsync(long teamId, TeamMemberQueryRequest query, CancellationToken ct = default)
        {
            var result = await _repository.GetTeamMembersAsync(teamId, query, ct);

            var items = result.Items.Select(member => new TeamMemberResponse
            {
                Id = member.Id,
                UserId = 1,
                User = new UserReference { Id = 1, Email = member.UserEmail, DisplayName = member.UserEmail.Split('@')[0] },
                Role = member.Role,
                JoinedAt = member.CreatedOn
            }).ToList();

            return new PagedResult<TeamMemberResponse>
            {
                Items = items,
                TotalCount = result.TotalCount
            };
        }

        public async Task<TeamMemberResponse?> AddMemberAsync(long teamId, TeamMemberRequest request, CancellationToken ct = default)
        {
            var existing = await _repository.GetTeamMemberAsync(teamId, request.UserEmail, ct);
            if (existing != null)
            {
                Log.Warning("User {UserEmail} is already a member of team {TeamId}", request.UserEmail, teamId);
                return null;
            }

            var member = new TeamMember
            {
                TeamId = teamId,
                UserEmail = request.UserEmail,
                Role = request.Role,
                CreatedOn = DateTime.UtcNow,
                UpdatedOn = DateTime.UtcNow,
                CreatedBy = "system",
                UpdatedBy = "system"
            };

            var memberId = await _repository.AddMemberAsync(member, ct);

            var teamMember = new TeamMemberResponse
            {
                Id = memberId,
                UserId = 1,
                User = new UserReference { Id = 1, Email = member.UserEmail, DisplayName = member.UserEmail.Split('@')[0] },
                Role = member.Role,
                JoinedAt = member.CreatedOn
            };

            Log.Information("Team member added: MemberId {MemberId}, TeamId {TeamId}, UserEmail {UserEmail}", memberId, teamId, request.UserEmail);

            return teamMember;
        }

        public async Task<bool> UpdateMemberRoleAsync(long teamId, string userEmail, UpdateTeamMemberRequest request, CancellationToken ct = default)
        {
            var member = await _repository.GetTeamMemberAsync(teamId, userEmail, ct);
            if (member == null)
            {
                Log.Warning("Team member not found: TeamId {TeamId}, UserEmail {UserEmail}", teamId, userEmail);
                return false;
            }

            Log.Information("Before update: TeamId={TeamId}, Email={Email}, OldRole={OldRole}, NewRole={NewRole}",
                teamId, userEmail, member.Role, request.Role);

            member.Role = request.Role;
            var success = await _repository.UpdateMemberRoleAsync(teamId, userEmail, member, ct);

            Log.Information("Team member role updated: TeamId {TeamId}, UserEmail {UserEmail}, NewRole {Role}, Success={Success}",
                teamId, userEmail, request.Role, success);

            return success;
        }

        public async Task<bool> RemoveMemberAsync(long teamId, string userEmail, CancellationToken ct = default)
        {
            var member = await _repository.GetTeamMemberAsync(teamId, userEmail, ct);
            if (member == null) return false;

            var success = await _repository.RemoveMemberAsync(teamId, userEmail, ct);

            if (success)
            {
                Log.Information("Team member removed: TeamId {TeamId}, UserEmail {UserEmail}", teamId, userEmail);
            }

            return success;
        }

        private TeamResponse MapToTeamResponse(SalesTeam team, int? memberCount, int? dealCount, int? customerCount)
        {
            return new TeamResponse
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                GroupMail = team.GroupMail,
                CreatedOn = team.CreatedOn,
                CreatedBy = new UserReference { Id = 1, Email = team.CreatedBy, DisplayName = team.CreatedBy.Split('@')[0] },
                UpdatedOn = team.UpdatedOn,
                UpdatedBy = !string.IsNullOrEmpty(team.UpdatedBy) ? new UserReference { Id = 1, Email = team.UpdatedBy, DisplayName = team.UpdatedBy.Split('@')[0] } : null,
                MemberCount = memberCount ?? 0,
                DealCount = dealCount ?? 0,
                CustomerCount = customerCount ?? 0
            };
        }

        private TeamMemberResponse MapToTeamMemberResponse(TeamMember member)
        {
            return new TeamMemberResponse
            {
                Id = member.Id,
                UserId = 1, // TODO: Get from user service
                User = new UserReference { Id = 1, Email = member.UserEmail, DisplayName = "User" }, // TODO: Get from user service
                Role = member.Role,
                JoinedAt = member.CreatedOn
            };
        }
    }
}