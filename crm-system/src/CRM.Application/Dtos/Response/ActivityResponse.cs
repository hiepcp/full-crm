namespace CRMSys.Application.Dtos.Response
{
    public class ActivityResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === External Integration ===
        public string? ExternalId { get; set; }
        public string? ConversationId { get; set; }
        public string? SourceFrom { get; set; }

        // === Activity Content ===
        public string? Subject { get; set; }
        public string? Body { get; set; }

        // === Activity Details ===
        public string ActivityType { get; set; } = "note";
        public DateTime CreatedOnActivity { get; set; }
        public DateTime? DueAt { get; set; }
        public DateTime? StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string Status { get; set; } = "open";
        public string Priority { get; set; } = "normal";
        public string? AssignedTo { get; set; }

        // === Relations ===
        public string? RelationType { get; set; }
        public long? RelationId { get; set; }

        // === Call/Task Specific ===
        public int? CallDuration { get; set; }
        public string? CallOutcome { get; set; }

        // === Contract Specific ===
        public DateTime? ContractDate { get; set; }
        public decimal? ContractValue { get; set; }

        // === Computed Properties ===
        public bool IsEmail => ActivityType == "email";
        public bool IsCall => ActivityType == "call";
        public bool IsMeeting => ActivityType == "meeting";
        public bool IsTask => ActivityType == "task";
        public bool IsNote => ActivityType == "note";
        public bool IsContract => ActivityType == "contract";

        public bool IsOpen => Status == "open";
        public bool IsInProgress => Status == "in_progress";
        public bool IsCompleted => Status == "completed";
        public bool IsCancelled => Status == "cancelled";
        public bool IsOverdue => Status == "overdue";

        public bool IsLowPriority => Priority == "low";
        public bool IsNormalPriority => Priority == "normal";
        public bool IsHighPriority => Priority == "high";
        public bool IsUrgent => Priority == "urgent";

        public string DisplayName => !string.IsNullOrEmpty(Subject) ? Subject : $"{ActivityType} Activity";
        public bool IsPastDue => DueAt.HasValue && DueAt.Value < DateTime.UtcNow && IsOpen;
        public bool CanBeCompleted => IsOpen || IsInProgress;
    }
}
