using CRMSys.Domain.Entities;
using CRMSys.Application.Dtos.Teams;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    public interface ISalesTeamRepository
    {
        Task<PagedResult<SalesTeam>> QueryAsync(QueryTeamsRequest query, CancellationToken ct = default);
        Task<SalesTeam?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> AddAsync(SalesTeam entity, CancellationToken ct = default);
        Task<bool> UpdateAsync(SalesTeam entity, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);
        Task<bool> IsNameUniqueAsync(string name, CancellationToken ct = default);
        Task<int> GetMemberCountAsync(long teamId, CancellationToken ct = default);
        Task<PagedResult<TeamMember>> GetTeamMembersAsync(long teamId, TeamMemberQueryRequest query, CancellationToken ct = default);
        Task<TeamMember?> GetTeamMemberAsync(long teamId, string userEmail, CancellationToken ct = default);
        Task<long> AddMemberAsync(TeamMember member, CancellationToken ct = default);
        Task<bool> UpdateMemberRoleAsync(long teamId, string userEmail, TeamMember member, CancellationToken ct = default);
        Task<bool> RemoveMemberAsync(long teamId, string userEmail, CancellationToken ct = default);
        Task<int> GetDealCountAsync(long teamId, CancellationToken ct = default);
        Task<int> GetCustomerCountAsync(long teamId, CancellationToken ct = default);
    }
}
