namespace CRMSys.Application.Dtos.Request
{
    public class QuotationQueryRequest : BaseQueryRequest
    {
        public string? QuotationNumber { get; set; }
        public string? Name { get; set; }
        public decimal? MinTotalAmount { get; set; }
        public decimal? MaxTotalAmount { get; set; }
        public string? Status { get; set; }
        public DateTime? ValidUntilFrom { get; set; }
        public DateTime? ValidUntilTo { get; set; }
        public long? CustomerId { get; set; }
    }
}
