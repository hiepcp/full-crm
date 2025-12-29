namespace CRMSys.Application.Dtos.Request
{
    public class ContactQueryRequest : BaseQueryRequest
    {
        public long? CustomerId { get; set; }
        public string? Email { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public bool? IsPrimary { get; set; }
    }
}
