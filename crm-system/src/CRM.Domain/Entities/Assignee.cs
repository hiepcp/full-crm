using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Assignee entity representing user assignments to entities
    /// </summary>
    [Table("crm_assignee")]
    public class Assignee : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Relations ===
        public string RelationType { get; set; } = string.Empty; // lead, contact, deal, customer
        public long RelationId { get; set; }
        public string UserEmail { get; set; } = string.Empty; // User email from crm_user table

        // === Assignment Details ===
        public string Role { get; set; } = "collaborator"; // owner, collaborator, follower, etc.
        public DateTime AssignedAt { get; set; }
        public string? Notes { get; set; }

        // === Joined Properties (from crm_user) ===
        [NotMapped]
        public long UserId { get; set; } // Populated from JOIN with crm_user

        // === Computed Properties ===
        [NotMapped]
        public bool IsOwner => Role == "owner";
        [NotMapped]
        public bool IsCollaborator => Role == "collaborator";
        [NotMapped]
        public bool IsFollower => Role == "follower";
        [NotMapped]
        public string DisplayRole => Role switch
        {
            "owner" => "Owner",
            "collaborator" => "Collaborator",
            "follower" => "Follower",
            _ => Role
        };
        [NotMapped]
        public TimeSpan AssignmentAge => DateTime.UtcNow - AssignedAt;

        // === Business Logic Helpers ===
        [NotMapped]
        public bool IsRelatedToLead => RelationType == "lead";
        [NotMapped]
        public bool IsRelatedToContact => RelationType == "contact";
        [NotMapped]
        public bool IsRelatedToDeal => RelationType == "deal";
        [NotMapped]
        public bool IsRelatedToCustomer => RelationType == "customer";
        [NotMapped]
        public bool CanBeRemoved => !IsOwner; // Owners might need special handling

        /// <summary>
        /// Change role with validation
        /// </summary>
        public bool ChangeRole(string newRole)
        {
            var validRoles = new[] { "owner", "collaborator", "follower" };
            if (!validRoles.Contains(newRole))
                return false;

            Role = newRole;
            return true;
        }

        /// <summary>
        /// Update assignment notes
        /// </summary>
        public void UpdateNotes(string notes)
        {
            Notes = notes;
        }
    }
}
