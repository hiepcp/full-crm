using CRMSys.Application.Dtos.Teams;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface ISalesTeamService
    {
        Task<PagedResult<TeamResponse>> QueryAsync(QueryTeamsRequest query, CancellationToken ct = default);
        Task<TeamResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreateTeamRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateTeamRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);

        // Team members
        Task<PagedResult<TeamMemberResponse>> GetTeamMembersAsync(long teamId, TeamMemberQueryRequest query, CancellationToken ct = default);
        Task<TeamMemberResponse?> AddMemberAsync(long teamId, TeamMemberRequest request, CancellationToken ct = default);
        Task<bool> UpdateMemberRoleAsync(long teamId, string userEmail, UpdateTeamMemberRequest request, CancellationToken ct = default);
        Task<bool> RemoveMemberAsync(long teamId, string userEmail, CancellationToken ct = default);
    }
}