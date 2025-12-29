using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Lead score rule entity - simplified single-table design
    /// Awards points if the specified field has a value (existence check)
    /// </summary>
    [Table("crm_lead_score_rule")]
    public class LeadScoreRule : BaseEntity
    {
        public long Id { get; set; }
        
        /// <summary>
        /// Rule name for display (e.g., "Source Provided", "Email Provided")
        /// </summary>
        public string RuleName { get; set; } = string.Empty;
        
        /// <summary>
        /// Description of the rule
        /// </summary>
        public string? Description { get; set; }
        
        /// <summary>
        /// Field name in crm_lead table (Source, Email, Company, etc.)
        /// </summary>
        public string FieldName { get; set; } = string.Empty;
        
        /// <summary>
        /// Score awarded when field has value
        /// </summary>
        public int Score { get; set; }
        
        /// <summary>
        /// Enable/disable rule
        /// </summary>
        public bool IsActive { get; set; } = true;
    }
}
