using CRMSys.Domain.Entities;
using CRMSys.Application.Dtos.Teams;
using Shared.Dapper.Models;

namespace CRMSys.Infrastructure.Repositories
{
    public interface ISalesTeamRepository : IRepository<SalesTeam, long>
    {
        Task<PagedResult<SalesTeam>> QueryAsync(QueryTeamsRequest query, CancellationToken ct = default);
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
}