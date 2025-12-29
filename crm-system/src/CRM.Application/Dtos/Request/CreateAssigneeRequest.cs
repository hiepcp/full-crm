using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for creating a new Assignee
    /// </summary>
    public class CreateAssigneeRequest
    {
        // === Required Fields ===
        [Required(ErrorMessage = "Relation type is required")]
        [RegularExpression("^(lead|contact|deal|customer|activity)$",
            ErrorMessage = "Relation type must be one of: lead, contact, deal, customer, activity")]
        public string? RelationType { get; set; }

        [Required(ErrorMessage = "Relation ID is required")]
        [Range(1, long.MaxValue, ErrorMessage = "Relation ID must be greater than 0")]
        public long RelationId { get; set; }

        [Required(ErrorMessage = "User Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string UserEmail { get; set; } = string.Empty;

        // === Optional Fields ===
        [RegularExpression("^(owner|collaborator|follower)$",
            ErrorMessage = "Role must be one of: owner, collaborator, follower")]
        public string? Role { get; set; } = "collaborator";

        [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
        public string? Notes { get; set; }

        // === Computed Properties ===
        public bool IsOwner => Role == "owner";
        public bool IsCollaborator => Role == "collaborator";
        public bool IsFollower => Role == "follower";
    }
}













