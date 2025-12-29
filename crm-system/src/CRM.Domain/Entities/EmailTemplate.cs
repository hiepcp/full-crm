using System.ComponentModel.DataAnnotations.Schema;
using CRMSys.Domain.Enums;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Email template entity for managing reusable email templates
    /// </summary>
    [Table("crm_email_templates")]
    public class EmailTemplate : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Basic Information ===
        public string Name { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty; // HTML content
        public string? Description { get; set; }

        // === Ownership & Sharing ===
        public bool IsShared { get; set; } = false;

        // === Template Metadata ===
        public EmailTemplateCategory Category { get; set; } = EmailTemplateCategory.General;

        // === Status & Tracking ===
        public bool IsActive { get; set; } = true;
        public int UsageCount { get; set; } = 0;
        public DateTime? LastUsedAt { get; set; }

        // === Soft Delete ===
        public DateTime? DeletedAt { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public bool IsDeleted => DeletedAt.HasValue;

        [NotMapped]
        public string AccessLevel => IsShared ? "Shared" : "Private";

        // === Business Logic Methods ===
        public void MarkAsUsed()
        {
            UsageCount++;
            LastUsedAt = DateTime.UtcNow;
        }

        public void SoftDelete()
        {
            DeletedAt = DateTime.UtcNow;
            IsActive = false;
        }

        public void Restore()
        {
            DeletedAt = null;
            IsActive = true;
        }

        public bool CanBeEditedBy(string userEmail)
        {
            // Owner can always edit
            if (CreatedBy?.Equals(userEmail, StringComparison.OrdinalIgnoreCase) == true) return true;

            // Shared templates can be edited by anyone
            if (IsShared) return true;

            return false;
        }

        public bool CanBeDeletedBy(string userEmail)
        {
            // Only owner can delete
            return CreatedBy?.Equals(userEmail, StringComparison.OrdinalIgnoreCase) == true;
        }
        
        public bool IsOwnedBy(string userEmail)
        {
            return CreatedBy?.Equals(userEmail, StringComparison.OrdinalIgnoreCase) == true;
        }
    }
}
