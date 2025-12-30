using CRMSys.Domain.Entities;

namespace CRMSys.Application.Dtos.Teams
{
    public class TeamMemberRequest
    {
        public string UserEmail { get; set; } = string.Empty;
        public TeamRole Role { get; set; } = TeamRole.Member;
    }
}