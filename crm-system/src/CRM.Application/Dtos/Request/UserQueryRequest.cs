namespace CRMSys.Application.Dtos.Request
{
    public class UserQueryRequest : BaseQueryRequest
    {
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? Role { get; set; }
        public bool? IsActive { get; set; }
    }
}
