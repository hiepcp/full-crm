namespace CRMSys.Application.Dtos.Request
{
    public class CreateQuotationRequest
    {
        public string QuotationNumber { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public decimal? TotalAmount { get; set; }
        public string Status { get; set; } = "draft";
        public DateTime? ValidUntil { get; set; }
        public string? Notes { get; set; }
        public long? CustomerId { get; set; }
    }
}
