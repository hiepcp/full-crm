using System.Text.Json.Serialization;

namespace CRMSys.Application.Dtos.Request
{
    public class DealQuotationQueryRequest : BaseQueryRequest
    {
        // === Simple Filters (mapped from query params) ===
        public long? DealId { get; set; }
        public string? QuotationNumber { get; set; }
        public DateTime? CreatedFrom { get; set; }
        public DateTime? CreatedTo { get; set; }
        public DateTime? UpdatedFrom { get; set; }
        public DateTime? UpdatedTo { get; set; }
    }
}

