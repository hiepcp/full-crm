namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for converting a lead to a deal
    /// </summary>
    public class ConvertLeadToDealRequest
    {
        // === Deal Information ===
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Stage { get; set; } = "Prospecting";
        public decimal? ExpectedRevenue { get; set; }
        public DateTime? CloseDate { get; set; }
        public string? Note { get; set; }

        // === Quotation Selection ===
        public List<string>? SelectedQuotationNumbers { get; set; }

        // === Contact Creation Option ===
        public bool CreateContact { get; set; } = true;

        // === Helper Properties ===
        public bool HasSelectedQuotations => SelectedQuotationNumbers != null && SelectedQuotationNumbers.Any();
    }
}
