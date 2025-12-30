namespace CRMSys.Application.Dtos.Teams
{
    public class TeamResponse
    {
        public long Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime CreatedAt { get; set; }
        public UserReference? CreatedBy { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public UserReference? UpdatedBy { get; set; }
        public int MemberCount { get; set; }
        public int DealCount { get; set; }
        public int CustomerCount { get; set; }
        public IEnumerable<TeamMemberResponse>? Members { get; set; }
    }
}