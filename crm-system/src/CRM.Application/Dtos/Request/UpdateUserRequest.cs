namespace CRMSys.Application.Dtos.Request
{
    public class UpdateUserRequest
    {
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Role { get; set; }
        public string? Avatar { get; set; }
        public bool? IsActive { get; set; }
    }
}
