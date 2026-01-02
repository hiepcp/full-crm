namespace CRMSys.Application.Dtos.Teams
{
    public class UserReference
    {
        public long Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string DisplayName { get; set; } = string.Empty;
        public string? Avatar { get; set; }
    }
}