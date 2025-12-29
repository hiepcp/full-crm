using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for updating an Assignee
    /// </summary>
    public class UpdateAssigneeRequest
    {
        // === Optional Fields ===
        [RegularExpression("^(owner|collaborator|follower)$",
            ErrorMessage = "Role must be one of: owner, collaborator, follower")]
        public string? Role { get; set; }

        [StringLength(1000, ErrorMessage = "Notes cannot exceed 1000 characters")]
        public string? Notes { get; set; }

        [Required(ErrorMessage = "User Email is required")]
        [EmailAddress(ErrorMessage = "Invalid email format")]
        public string UserEmail { get; set; } = string.Empty;

        // === Computed Properties ===
        public bool IsOwner => Role == "owner";
        public bool IsCollaborator => Role == "collaborator";
        public bool IsFollower => Role == "follower";
    }
}













