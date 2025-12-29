using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Pre-configured goal settings for common scenarios (monthly revenue, quarterly deals, etc.) enabling quick goal creation
    /// </summary>
    [Table("crm_goal_template")]
    public class GoalTemplate
    {
        public long Id { get; set; }

        // Template Information
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        // Default Goal Settings
        public string GoalType { get; set; } = string.Empty; // revenue, deals, activities, tasks, performance
        public string Timeframe { get; set; } = string.Empty; // this_week, this_month, this_quarter, this_year, custom
        public string OwnerType { get; set; } = "individual"; // individual, team, company
        public decimal? SuggestedTargetValue { get; set; }
        public bool Recurring { get; set; } = false;

        // Template Type
        public bool IsSystemTemplate { get; set; } = false; // TRUE for built-in templates, FALSE for custom

        // Audit
        public long? CreatedBy { get; set; } // User who created (NULL for system templates)
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public long? UpdatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }

        // Soft Delete
        public bool IsActive { get; set; } = true;

        // === Computed Properties ===
        [NotMapped]
        public bool IsCustomTemplate => !IsSystemTemplate;

        [NotMapped]
        public bool IsForIndividual => OwnerType == "individual";

        [NotMapped]
        public bool IsForTeam => OwnerType == "team";

        [NotMapped]
        public bool IsForCompany => OwnerType == "company";

        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : $"Template {Id}";

        [NotMapped]
        public string TypeBadge => IsSystemTemplate ? "System" : "Custom";
    }
}
