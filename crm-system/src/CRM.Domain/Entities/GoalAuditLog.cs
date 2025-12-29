using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Comprehensive audit trail of all goal changes for compliance, debugging, and historical analysis
    /// </summary>
    [Table("crm_goal_audit_log")]
    public class GoalAuditLog
    {
        public long Id { get; set; }

        // Associated Goal
        public long GoalId { get; set; }

        // Event Information
        public string EventType { get; set; } = string.Empty; // create, update, delete, progress_update, status_change, ownership_change, calculation_event, hierarchy_change

        // Change Details
        public string? BeforeValue { get; set; } // Value before change (JSON)
        public string? AfterValue { get; set; } // Value after change (JSON)
        public string? ChangeDetails { get; set; } // Additional context (JSON)

        // Audit
        public long? ChangedBy { get; set; } // User who made the change (NULL for system events)
        public DateTime ChangedOn { get; set; } = DateTime.UtcNow;

        // === Computed Properties ===
        [NotMapped]
        public bool IsCreateEvent => EventType == "create";

        [NotMapped]
        public bool IsUpdateEvent => EventType == "update";

        [NotMapped]
        public bool IsDeleteEvent => EventType == "delete";

        [NotMapped]
        public bool IsProgressUpdate => EventType == "progress_update";

        [NotMapped]
        public bool IsStatusChange => EventType == "status_change";

        [NotMapped]
        public bool IsOwnershipChange => EventType == "ownership_change";

        [NotMapped]
        public bool IsCalculationEvent => EventType == "calculation_event";

        [NotMapped]
        public bool IsHierarchyChange => EventType == "hierarchy_change";

        [NotMapped]
        public bool IsSystemEvent => !ChangedBy.HasValue;

        [NotMapped]
        public bool IsUserEvent => ChangedBy.HasValue;

        [NotMapped]
        public string EventTypeDisplay => EventType switch
        {
            "create" => "Goal Created",
            "update" => "Goal Updated",
            "delete" => "Goal Deleted",
            "progress_update" => "Progress Updated",
            "status_change" => "Status Changed",
            "ownership_change" => "Ownership Changed",
            "calculation_event" => "Auto-Calculation Event",
            "hierarchy_change" => "Hierarchy Changed",
            _ => EventType
        };

        [NotMapped]
        public string ChangedByDisplay => ChangedBy.HasValue ? $"User {ChangedBy}" : "System";
    }
}
