using System;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Audit log entity for tracking user registration events
    /// </summary>
    [Table("crm_user_audit_log")]
    public class UserAuditLog
    {
        /// <summary>
        /// Audit log entry ID
        /// </summary>
        public int Id { get; set; }

        /// <summary>
        /// ID of administrator who performed the registration
        /// </summary>
        public int? AdministratorId { get; set; }

        /// <summary>
        /// ID of the created user
        /// </summary>
        public int? RegisteredUserId { get; set; }

        /// <summary>
        /// Email of the registered user
        /// </summary>
        public string RegisteredUserEmail { get; set; } = string.Empty;

        /// <summary>
        /// Role assigned to user (single role per current schema)
        /// </summary>
        public string? AssignedRole { get; set; }

        /// <summary>
        /// Source of registration data (HCM or Manual)
        /// </summary>
        public string RegistrationSource { get; set; } = "Manual";

        /// <summary>
        /// Registration timestamp
        /// </summary>
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
    }
}
