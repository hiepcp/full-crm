namespace ResAuthZApi.Application.Dtos
{
    public class UserDto
    {
        public int UserId { get; set; }
        public string Email { get; set; } = default!;
        public string? FullName { get; set; }
        public string? UserName { get; set; }
        public List<string> Roles { get; set; } = new();
    }

    public class UserCreateRequest
    {
        public string Email { get; set; } = default!;
        public string? FullName { get; set; }
        public string? UserName { get; set; }
        public List<int> RoleIds { get; set; } = new();
    }

    public class UserUpdateRequest
    {
        public string? UserName { get; set; }
        public string? FullName { get; set; }
        public List<int> RoleIds { get; set; } = new();
    }
}
