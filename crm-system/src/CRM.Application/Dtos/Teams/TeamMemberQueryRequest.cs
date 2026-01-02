using CRMSys.Domain.Entities;

namespace CRMSys.Application.Dtos.Teams
{
    public class TeamMemberQueryRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 50;
        public string? Role { get; set; }
    }
}