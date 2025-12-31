namespace CRMSys.Application.Dtos.Response
{
    public class DealQuotationWithDynamicsDataResponse
    {
        // === Deal-Quotation Link Data ===
        public long DealQuotationId { get; set; }
        public long DealId { get; set; }
        public string QuotationNumber { get; set; } = string.Empty;
        public DateTime CreatedOn { get; set; }

        // === Dynamics 365 Data ===
        public string? QuotationName { get; set; }
        public string? SalesQuotationStatus { get; set; } // Status từ D365 cho pipeline logic
        public decimal? SalesQuotationAmount { get; set; }
        public DateTime? SalesQuotationExpirationDate { get; set; }
        public string? RequestingCustomerAccountNumber { get; set; }

        // === Computed Properties ===
        public string DisplayName => $"{QuotationNumber} - {QuotationName ?? "Unknown"}";
        public decimal TotalAmount => SalesQuotationAmount ?? 0;
    }
}

