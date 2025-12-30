using CRMSys.Domain.Entities;

namespace CRMSys.Application.Dtos.Teams
{
    public class UpdateTeamMemberRequest
    {
        public TeamRole Role { get; set; }
    }
}