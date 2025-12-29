using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Email template variable entity for storing variable metadata
    /// Used to populate variable selector UI
    /// </summary>
    [Table("crm_email_template_variables")]
    public class EmailTemplateVariable
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Variable Information ===
        public string VariableKey { get; set; } = string.Empty; // e.g., '{{user_name}}'
        public string VariableName { get; set; } = string.Empty; // Display name
        public string? Description { get; set; }

        // === Entity Mapping ===
        public string EntityType { get; set; } = string.Empty; // 'user', 'lead', 'deal', etc.
        public string FieldPath { get; set; } = string.Empty; // Database field path
        public string? ExampleValue { get; set; }

        // === Status & Display ===
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; } = 0;

        // === Audit ===
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        // === Computed Properties ===
        [NotMapped]
        public string DisplayText => $"{VariableKey} - {VariableName}";

        [NotMapped]
        public bool IsUserVariable => EntityType.Equals("user", StringComparison.OrdinalIgnoreCase);

        [NotMapped]
        public bool IsLeadVariable => EntityType.Equals("lead", StringComparison.OrdinalIgnoreCase);

        [NotMapped]
        public bool IsDealVariable => EntityType.Equals("deal", StringComparison.OrdinalIgnoreCase);

        [NotMapped]
        public bool IsContactVariable => EntityType.Equals("contact", StringComparison.OrdinalIgnoreCase);

        [NotMapped]
        public bool IsCustomerVariable => EntityType.Equals("customer", StringComparison.OrdinalIgnoreCase);

        [NotMapped]
        public bool IsSystemVariable => EntityType.Equals("system", StringComparison.OrdinalIgnoreCase);
    }
}
