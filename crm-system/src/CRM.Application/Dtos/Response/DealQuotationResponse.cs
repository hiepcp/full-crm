namespace CRMSys.Application.Dtos.Response
{
    public class DealQuotationResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Relations ===
        public long DealId { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;

        // === Computed Properties ===
        public string DisplayName => $"Deal-Quotation Link {Id}";
    }
}

