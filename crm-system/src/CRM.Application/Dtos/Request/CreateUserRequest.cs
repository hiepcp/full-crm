namespace CRMSys.Application.Dtos.Request
{
    public class CreateUserRequest
    {
        public string Email { get; set; } = string.Empty;
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Role { get; set; }
        public string? Avatar { get; set; }
        public bool IsActive { get; set; } = true;
    }
}
