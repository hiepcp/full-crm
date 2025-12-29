using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// PipelineLog entity representing the history of deal stage changes
    /// </summary>
    [Table("crm_pipeline_log")]
    public class PipelineLog : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Relations ===
        public long DealId { get; set; }

        // === Pipeline Change Information ===
        public string? OldStage { get; set; }

        public string NewStage { get; set; } = string.Empty;

        public string? ChangedBy { get; set; }

        public DateTime ChangedAt { get; set; } = DateTime.UtcNow;

        public string? Notes { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public string DisplayStageChange => $"{OldStage ?? "New"} → {NewStage}";
        [NotMapped]
        public string DisplayChangedAt => ChangedAt.ToString("yyyy-MM-dd HH:mm:ss");
        [NotMapped]
        public bool HasNotes => !string.IsNullOrEmpty(Notes);
        [NotMapped]
        public bool HasChangedBy => !string.IsNullOrEmpty(ChangedBy);

        // === Stage Helpers ===
        [NotMapped]
        public bool IsProspecting => NewStage == "Prospecting";
        [NotMapped]
        public bool IsQuotation => NewStage == "Quotation";
        [NotMapped]
        public bool IsProposal => NewStage == "Proposal";
        [NotMapped]
        public bool IsNegotiation => NewStage == "Negotiation";
        [NotMapped]
        public bool IsClosedWon => NewStage == "Closed Won";
        [NotMapped]
        public bool IsClosedLost => NewStage == "Closed Lost";
        [NotMapped]
        public bool IsOnHold => NewStage == "On Hold";
        [NotMapped]
        public bool WasProspecting => OldStage == "Prospecting";
        [NotMapped]
        public bool WasQuotation => OldStage == "Quotation";
        [NotMapped]
        public bool WasProposal => OldStage == "Proposal";
        [NotMapped]
        public bool WasNegotiation => OldStage == "Negotiation";

        // === Business Logic Helpers ===
        [NotMapped]
        public bool IsForwardProgress => GetStageOrder(NewStage) > GetStageOrder(OldStage ?? "");
        [NotMapped]
        public bool IsBackwardProgress => GetStageOrder(NewStage) < GetStageOrder(OldStage ?? "");
        [NotMapped]
        public bool IsStageChange => OldStage != NewStage;
        [NotMapped]
        public bool IsClosingStage => IsClosedWon || IsClosedLost;
        [NotMapped]
        public bool IsActiveStage => !IsClosingStage && NewStage != "On Hold";
        [NotMapped]
        public int DaysSinceChange => (int)(DateTime.UtcNow - ChangedAt).TotalDays;
        [NotMapped]
        public bool IsRecentChange => DaysSinceChange <= 7;

        /// <summary>
        /// Create a new pipeline log entry
        /// </summary>
        public static PipelineLog Create(long dealId, string? oldStage, string newStage, string? changedBy = null, string? notes = null)
        {
            return new PipelineLog
            {
                DealId = dealId,
                OldStage = oldStage,
                NewStage = newStage,
                ChangedBy = changedBy,
                ChangedAt = DateTime.UtcNow,
                Notes = notes,
                CreatedOn = DateTime.UtcNow,
                CreatedBy = changedBy
            };
        }

        /// <summary>
        /// Create a pipeline log for stage change
        /// </summary>
        public static PipelineLog CreateStageChange(long dealId, string oldStage, string newStage, string? changedBy = null, string? notes = null)
        {
            if (string.IsNullOrEmpty(oldStage) || string.IsNullOrEmpty(newStage))
                throw new ArgumentException("Old stage and new stage are required for stage change");

            return Create(dealId, oldStage, newStage, changedBy, notes);
        }

        /// <summary>
        /// Create a pipeline log for new deal
        /// </summary>
        public static PipelineLog CreateInitial(long dealId, string initialStage, string? changedBy = null, string? notes = null)
        {
            return Create(dealId, null, initialStage, changedBy, notes ?? "Initial deal creation");
        }

        /// <summary>
        /// Validate stage transition
        /// </summary>
        public bool IsValidStageTransition()
        {
            var validStages = new[] { "Prospecting", "Quotation", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "On Hold" };
            return validStages.Contains(NewStage) && (string.IsNullOrEmpty(OldStage) || validStages.Contains(OldStage));
        }

        /// <summary>
        /// Get stage order for comparison (higher number = more advanced stage)
        /// </summary>
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
