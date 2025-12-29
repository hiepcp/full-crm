namespace CRMSys.Application.Dtos.Response
{
    public class PipelineLogResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }

        // === Relations ===
        public long DealId { get; set; }

        // === Pipeline Change Information ===
        public string? OldStage { get; set; }
        public string NewStage { get; set; } = string.Empty;
        public string? ChangedBy { get; set; }
        public DateTime ChangedAt { get; set; }
        public string? Notes { get; set; }

        // === Computed Properties ===
        public string DisplayStageChange => $"{OldStage ?? "New"} → {NewStage}";
        public string DisplayChangedAt => ChangedAt.ToString("yyyy-MM-dd HH:mm:ss");
        public bool HasNotes => !string.IsNullOrEmpty(Notes);
        public bool HasChangedBy => !string.IsNullOrEmpty(ChangedBy);

        // === Stage Helpers ===
        public bool IsProspecting => NewStage == "Prospecting";
        public bool IsQuotation => NewStage == "Quotation";
        public bool IsProposal => NewStage == "Proposal";
        public bool IsNegotiation => NewStage == "Negotiation";
        public bool IsClosedWon => NewStage == "Closed Won";
        public bool IsClosedLost => NewStage == "Closed Lost";
        public bool IsOnHold => NewStage == "On Hold";
        public bool WasProspecting => OldStage == "Prospecting";
        public bool WasQuotation => OldStage == "Quotation";
        public bool WasProposal => OldStage == "Proposal";
        public bool WasNegotiation => OldStage == "Negotiation";

        // === Business Logic Helpers ===
        public bool IsForwardProgress => GetStageOrder(NewStage) > GetStageOrder(OldStage ?? "");
        public bool IsBackwardProgress => GetStageOrder(NewStage) < GetStageOrder(OldStage ?? "");
        public bool IsStageChange => OldStage != NewStage;
        public bool IsClosingStage => IsClosedWon || IsClosedLost;
        public bool IsActiveStage => !IsClosingStage && NewStage != "On Hold";
        public int DaysSinceChange => (int)(DateTime.UtcNow - ChangedAt).TotalDays;
        public bool IsRecentChange => DaysSinceChange <= 7;

        // Helper method for stage ordering
        private int GetStageOrder(string stage)
        {
            return stage switch
            {
                "Prospecting" => 1,
                "Quotation" => 2,
                "Proposal" => 3,
                "Negotiation" => 4,
                "Closed Won" => 5,
                "Closed Lost" => 5,
                "On Hold" => 0,
                _ => 0
            };
        }
    }
}
