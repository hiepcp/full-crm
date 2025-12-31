namespace CRMSys.Application.Dtos.Request
{
    public class UpdateDealRequest
    {
        // === Relations ===
        public long? CustomerId { get; set; }
        public long? OwnerId { get; set; }
        public long? LeadId { get; set; }
        public long? SalesTeamId { get; set; }

        // === Deal Information ===
        public string? Name { get; set; }
        public string? Description { get; set; }

        // === Deal Status ===
        public string? Stage { get; set; }
        public decimal? ExpectedRevenue { get; set; }
        public decimal? ActualRevenue { get; set; }
        public DateTime? CloseDate { get; set; }

        // === Contact Information ===
        public long? ContactId { get; set; }

        // === Additional Information ===
        public string? Note { get; set; }
    }
}
