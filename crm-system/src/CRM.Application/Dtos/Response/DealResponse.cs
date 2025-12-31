namespace CRMSys.Application.Dtos.Response
{
    public class DealResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Relations ===
        public long? CustomerId { get; set; }
        public long? OwnerId { get; set; }
        public long? LeadId { get; set; }
        public long? SalesTeamId { get; set; }

        // === Deal Information ===
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // === Deal Status ===
        public string Stage { get; set; } = "Prospecting";
        public decimal? ExpectedRevenue { get; set; }
        public decimal? ActualRevenue { get; set; }
        public DateTime? CloseDate { get; set; }

        // === Contact Information ===
        public long? ContactId { get; set; }

        // === Additional Information ===
        public string? Note { get; set; }

        // === Computed Properties ===
        public bool IsProspecting => Stage == "Prospecting";
        public bool IsQuotation => Stage == "Quotation";
        public bool IsProposal => Stage == "Proposal";
        public bool IsNegotiation => Stage == "Negotiation";
        public bool IsClosedWon => Stage == "Closed Won";
        public bool IsClosedLost => Stage == "Closed Lost";
        public bool IsOnHold => Stage == "On Hold";
        public bool IsClosed => IsClosedWon || IsClosedLost;
        public bool IsOpen => !IsClosed;
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : $"Deal {Id}";
        public decimal Revenue => ActualRevenue ?? ExpectedRevenue ?? 0;
        public int DaysToClose => CloseDate.HasValue ? (int)(CloseDate.Value - DateTime.UtcNow).TotalDays : 0;
        public bool IsOverdue => CloseDate.HasValue && CloseDate.Value < DateTime.UtcNow && IsOpen;
        public double Probability => Stage switch
        {
            "Prospecting" => 10,
            "Quotation" => 30,
            "Proposal" => 60,
            "Negotiation" => 80,
            "Closed Won" => 100,
            "Closed Lost" => 0,
            "On Hold" => 20,
            _ => 0
        };
    }
}
