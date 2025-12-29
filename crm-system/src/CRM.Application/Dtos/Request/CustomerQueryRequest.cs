namespace CRMSys.Application.Dtos.Request
{
    public class CustomerQueryRequest : BaseQueryRequest
    {
        public string? Name { get; set; }
        public string? Email { get; set; }
        public string? Type { get; set; }
        public long? OwnerId { get; set; }
        public string? Country { get; set; }
        public string? Industry { get; set; }
    }
}
