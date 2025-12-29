using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// User-generated notes and discussions attached to specific goals for collaboration and context sharing
    /// </summary>
    [Table("crm_goal_comment")]
    public class GoalComment
    {
        public long Id { get; set; }

        // Associated Goal
        public long GoalId { get; set; }

        // Comment Content
        public string CommentText { get; set; } = string.Empty;

        // Audit
        public long CreatedBy { get; set; }
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedOn { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public bool IsEdited => UpdatedOn.HasValue;

        [NotMapped]
        public string TimeAgo
        {
            get
            {
                var elapsed = DateTime.UtcNow - CreatedOn;
                if (elapsed.TotalMinutes < 1) return "just now";
                if (elapsed.TotalMinutes < 60) return $"{(int)elapsed.TotalMinutes}m ago";
                if (elapsed.TotalHours < 24) return $"{(int)elapsed.TotalHours}h ago";
                if (elapsed.TotalDays < 7) return $"{(int)elapsed.TotalDays}d ago";
                if (elapsed.TotalDays < 30) return $"{(int)(elapsed.TotalDays / 7)}w ago";
                return CreatedOn.ToString("MMM dd, yyyy");
            }
        }

        [NotMapped]
        public int CharacterCount => CommentText?.Length ?? 0;
    }
}
