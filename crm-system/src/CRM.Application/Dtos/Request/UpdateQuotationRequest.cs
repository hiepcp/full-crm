namespace CRMSys.Application.Dtos.Request
{
    public class UpdateQuotationRequest
    {
        public string? QuotationNumber { get; set; }
        public string? Name { get; set; }
        public string? Description { get; set; }
        public decimal? TotalAmount { get; set; }
        public string? Status { get; set; }
        public DateTime? ValidUntil { get; set; }
        public string? Notes { get; set; }
        public long? CustomerId { get; set; }
    }
}
