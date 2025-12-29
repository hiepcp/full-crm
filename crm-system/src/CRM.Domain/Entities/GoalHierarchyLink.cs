using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Explicitly tracks parent-child relationships between goals for hierarchical structures and roll-up calculations
    /// </summary>
    [Table("crm_goal_hierarchy_link")]
    public class GoalHierarchyLink
    {
        public long Id { get; set; }

        // Hierarchy Relationship
        public long ParentGoalId { get; set; }
        public long ChildGoalId { get; set; }

        // Roll-up Configuration
        public decimal ContributionWeight { get; set; } = 1.0m; // Weight for weighted average roll-up (future use)

        // Audit
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public long? CreatedBy { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public bool IsEqualWeight => ContributionWeight == 1.0m;

        [NotMapped]
        public string DisplayWeight => $"{ContributionWeight * 100}%";
    }
}
