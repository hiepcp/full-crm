using System.Text.Json.Serialization;

namespace CRMSys.Application.Dtos.Request
{
    public class DealQueryRequest : BaseQueryRequest
    {
        // === Simple Filters (mapped from query params) ===
        public long? CustomerId { get; set; }
        public long? OwnerId { get; set; }
        public long? LeadId { get; set; }
        public string? Stage { get; set; }
        public long? ContactId { get; set; }
        public decimal? MinExpectedRevenue { get; set; }
        public decimal? MaxExpectedRevenue { get; set; }
        public DateTime? CloseDateFrom { get; set; }
        public DateTime? CloseDateTo { get; set; }
    }
}
