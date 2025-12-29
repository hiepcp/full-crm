using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Activity entity representing various CRM activities (emails, calls, meetings, tasks, etc.)
    /// </summary>
    [Table("crm_activity")]
    public class Activity : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === External Integration ===
        public string? ExternalId { get; set; }
        public string? ConversationId { get; set; }
        public string? SourceFrom { get; set; }

        // === Activity Content ===
        public string? Subject { get; set; }
        public string? Body { get; set; }

        // === Activity Details ===
        public string ActivityType { get; set; } = "note"; // ENUM: email, call, meeting, task, note, contract, reminder, other
        public DateTime? DueAt { get; set; }
        public DateTime? StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public string Status { get; set; } = "open"; // ENUM: open, in_progress, completed, cancelled, overdue
        public string Priority { get; set; } = "normal"; // ENUM: low, normal, high, urgent
        public string? AssignedTo { get; set; }

        // === Relations ===
        public string? RelationType { get; set; } // lead, contact, deal, customer
        public long? RelationId { get; set; }

        // === Call/Task Specific ===
        public int? CallDuration { get; set; } // in seconds
        public string? CallOutcome { get; set; }

        // === Contract Specific ===
        public DateTime? ContractDate { get; set; }
        public decimal? ContractValue { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public bool IsEmail => ActivityType == "email";
        [NotMapped]
        public bool IsCall => ActivityType == "call";
        [NotMapped]
        public bool IsMeeting => ActivityType == "meeting";
        [NotMapped]
        public bool IsTask => ActivityType == "task";
        [NotMapped]
        public bool IsNote => ActivityType == "note";
        [NotMapped]
        public bool IsReminder => ActivityType == "reminder";
        [NotMapped]
        public bool IsContract => ActivityType == "contract";

        [NotMapped]
        public bool IsOpen => Status == "open";
        [NotMapped]
        public bool IsInProgress => Status == "in_progress";
        [NotMapped]
        public bool IsCompleted => Status == "completed";
        [NotMapped]
        public bool IsCancelled => Status == "cancelled";
        [NotMapped]
        public bool IsOverdue => Status == "overdue";

        [NotMapped]
        public bool IsLowPriority => Priority == "low";
        [NotMapped]
        public bool IsNormalPriority => Priority == "normal";
        [NotMapped]
        public bool IsHighPriority => Priority == "high";
        [NotMapped]
        public bool IsUrgent => Priority == "urgent";

        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(Subject) ? Subject : $"{ActivityType} Activity";
        [NotMapped]
        public bool IsPastDue => DueAt.HasValue && DueAt.Value < DateTime.UtcNow && IsOpen;
        [NotMapped]
        public bool CanBeCompleted => IsOpen || IsInProgress;
        [NotMapped]
        public TimeSpan? TimeToDue => DueAt.HasValue ? DueAt.Value - DateTime.UtcNow : null;
        [NotMapped]
        public TimeSpan? Duration => StartAt.HasValue && EndAt.HasValue ? EndAt.Value - StartAt.Value : null;

        // === Business Logic Helpers ===
        [NotMapped]
        public bool IsRelatedToLead => RelationType == "lead" && RelationId.HasValue;
        [NotMapped]
        public bool IsRelatedToContact => RelationType == "contact" && RelationId.HasValue;
        [NotMapped]
        public bool IsRelatedToDeal => RelationType == "deal" && RelationId.HasValue;
        [NotMapped]
        public bool IsRelatedToCustomer => RelationType == "customer" && RelationId.HasValue;

        /// <summary>
        /// Mark activity as completed
        /// </summary>
        public void MarkAsCompleted()
        {
            Status = "completed";
            CompletedAt = DateTime.UtcNow;
        }

        /// <summary>
        /// Mark activity as in progress
        /// </summary>
        public void MarkAsInProgress()
        {
            Status = "in_progress";
        }

        /// <summary>
        /// Mark activity as overdue
        /// </summary>
        public void MarkAsOverdue()
        {
            Status = "overdue";
        }

        /// <summary>
        /// Cancel activity
        /// </summary>
        public void Cancel()
        {
            Status = "cancelled";
        }

        /// <summary>
        /// Change priority with validation
        /// </summary>
        public bool ChangePriority(string newPriority)
        {
            var validPriorities = new[] { "low", "normal", "high", "urgent" };
            if (!validPriorities.Contains(newPriority))
                return false;

            Priority = newPriority;
            return true;
        }

        /// <summary>
        /// Change status with validation
        /// </summary>
        public bool ChangeStatus(string newStatus)
        {
            var validStatuses = new[] { "open", "in_progress", "completed", "cancelled", "overdue" };
            if (!validStatuses.Contains(newStatus))
                return false;

            Status = newStatus;

            // Auto-set completed date
            if (newStatus == "completed")
            {
                CompletedAt = DateTime.UtcNow;
            }

            return true;
        }

        /// <summary>
        /// Assign to user
        /// </summary>
        public void AssignTo(string assignedTo)
        {
            AssignedTo = assignedTo;
        }

        /// <summary>
        /// Relate to entity
        /// </summary>
        public void RelateTo(string relationType, long relationId)
        {
            RelationType = relationType;
            RelationId = relationId;
        }
    }
}
