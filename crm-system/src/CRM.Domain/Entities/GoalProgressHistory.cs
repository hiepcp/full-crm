using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Captures timestamped snapshots of goal progress for trend analysis, velocity calculations, and audit trails
    /// </summary>
    [Table("crm_goal_progress_history")]
    public class GoalProgressHistory
    {
        public long Id { get; set; }

        // Associated Goal
        public long GoalId { get; set; }

        // Snapshot Values
        public decimal ProgressValue { get; set; }
        public decimal TargetValue { get; set; }
        public decimal ProgressPercentage { get; set; }

        // Snapshot Metadata
        public string SnapshotSource { get; set; } = string.Empty; // significant_change, daily_snapshot, manual_adjustment, status_change
        public DateTime SnapshotTimestamp { get; set; } = DateTime.UtcNow;

        // Audit
        public long? CreatedBy { get; set; } // User if manual adjustment, NULL if auto
        public string? Notes { get; set; } // Optional notes (e.g., why manual adjustment)

        // === Computed Properties ===
        [NotMapped]
        public bool IsSignificantChange => SnapshotSource == "significant_change";

        [NotMapped]
        public bool IsDailySnapshot => SnapshotSource == "daily_snapshot";

        [NotMapped]
        public bool IsManualAdjustment => SnapshotSource == "manual_adjustment";

        [NotMapped]
        public bool IsStatusChange => SnapshotSource == "status_change";

        [NotMapped]
        public bool IsAutomaticSnapshot => IsDailySnapshot || IsSignificantChange;

        [NotMapped]
        public string SnapshotSourceDisplay => SnapshotSource switch
        {
            "significant_change" => "Significant Progress Change",
            "daily_snapshot" => "Daily Snapshot",
            "manual_adjustment" => "Manual Adjustment",
            "status_change" => "Status Change",
            _ => SnapshotSource
        };
    }
}
