using CRMSys.Application.Dtos.Teams;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using CRMSys.Infrastructure.Repositories;
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

            var items = result.Items.Select(MapToTeamResponse).ToList();

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
            existing.UpdatedBy = userEmail;
            existing.UpdatedOn = DateTime.UtcNow;
            existing.UpdatedAt = DateTime.UtcNow;

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
                Role = member.Role.ToString(),
                JoinedAt = member.JoinedAt
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
            if (existing != null) return null;

            var member = new TeamMember
            {
                TeamId = teamId,
                UserEmail = request.UserEmail,
                Role = request.Role,
                JoinedAt = DateTime.UtcNow
            };

            var memberId = await _repository.AddMemberAsync(member, ct);

            var teamMember = new TeamMemberResponse
            {
                Id = memberId,
                UserId = 1,
                User = new UserReference { Id = 1, Email = member.UserEmail, DisplayName = member.UserEmail.Split('@')[0] },
                Role = member.Role.ToString(),
                JoinedAt = member.JoinedAt
            };

            return teamMember;
        }

        public async Task<bool> UpdateMemberRoleAsync(long teamId, string userEmail, UpdateTeamMemberRequest request, CancellationToken ct = default)
        {
            var success = await _repository.UpdateMemberRoleAsync(teamId, userEmail, new TeamMember { Role = request.Role }, ct);
            return success;
        }

        public async Task<bool> RemoveMemberAsync(long teamId, string userEmail, CancellationToken ct = default)
        {
            var success = await _repository.RemoveMemberAsync(teamId, userEmail, ct);
            return success;
        }

        public async Task<TeamMemberResponse?> AddMemberAsync(long teamId, TeamMemberRequest request, CancellationToken ct = default)
        {
            // Check if already member
            var existing = await _repository.GetTeamMemberAsync(teamId, request.UserEmail, ct);
            if (existing != null) return null;

            var member = new TeamMember
            {
                TeamId = teamId,
                UserEmail = request.UserEmail,
                Role = request.Role,
                JoinedAt = DateTime.UtcNow
            };

            member.Id = await _repository.AddMemberAsync(member, ct);

            return MapToTeamMemberResponse(member);
        }

        public async Task<bool> UpdateMemberRoleAsync(long teamId, string userEmail, UpdateTeamMemberRequest request, CancellationToken ct = default)
        {
            var member = await _repository.GetTeamMemberAsync(teamId, userEmail, ct);
            if (member == null) return false;

            member.Role = request.Role;

            await _repository.UpdateAsync(member, ct);

            return true;
        }

        public async Task<bool> RemoveMemberAsync(long teamId, string userEmail, CancellationToken ct = default)
        {
            var member = await _repository.GetTeamMemberAsync(teamId, userEmail, ct);
            if (member == null) return false;

            return await _repository.DeleteAsync(member.Id, ct);
        }

        private TeamResponse MapToTeamResponse(SalesTeam team, int? memberCount, int? dealCount, int? customerCount)
        {
            return new TeamResponse
            {
                Id = team.Id,
                Name = team.Name,
                Description = team.Description,
                CreatedAt = team.CreatedAt,
                CreatedBy = new UserReference { Id = 1, Email = team.CreatedBy, DisplayName = team.CreatedBy.Split('@')[0] },
                UpdatedAt = team.UpdatedAt,
                UpdatedBy = team.UpdatedBy.HasValue ? new UserReference { Id = 1, Email = team.UpdatedBy, DisplayName = team.UpdatedBy.Split('@')[0] } : null,
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
                Role = member.Role.ToString(),
                JoinedAt = member.JoinedAt
            };
        }
    }
}