using CRMSys.Domain.Entities;

namespace CRMSys.Application.Dtos.Teams
{
    public class TeamMemberResponse
    {
        public long Id { get; set; }
        public long UserId { get; set; }
        public UserReference? User { get; set; }
        public TeamRole Role { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}