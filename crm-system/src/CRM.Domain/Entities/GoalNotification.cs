using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Stores notifications for goal events (creation, assignment, at-risk status, overdue) to be sent to users
    /// </summary>
    [Table("crm_goal_notification")]
    public class GoalNotification
    {
        public long Id { get; set; }

        // Associated Goal
        public long GoalId { get; set; }

        // Recipient
        public long RecipientUserId { get; set; }

        // Notification Content
        public string NotificationType { get; set; } = string.Empty; // created, assigned, completed, at_risk, overdue, milestone
        public string Message { get; set; } = string.Empty;

        // Status
        public bool IsRead { get; set; } = false;
        public DateTime? SentAt { get; set; } // NULL = pending

        // Audit
        public DateTime CreatedOn { get; set; } = DateTime.UtcNow;

        // === Computed Properties ===
        [NotMapped]
        public bool IsPending => !SentAt.HasValue;

        [NotMapped]
        public bool IsSent => SentAt.HasValue;

        [NotMapped]
        public bool IsCreatedNotification => NotificationType == "created";

        [NotMapped]
        public bool IsAssignedNotification => NotificationType == "assigned";

        [NotMapped]
        public bool IsCompletedNotification => NotificationType == "completed";

        [NotMapped]
        public bool IsAtRiskNotification => NotificationType == "at_risk";

        [NotMapped]
        public bool IsOverdueNotification => NotificationType == "overdue";

        [NotMapped]
        public bool IsMilestoneNotification => NotificationType == "milestone";

        [NotMapped]
        public string NotificationTypeDisplay => NotificationType switch
        {
            "created" => "Goal Created",
            "assigned" => "Goal Assigned",
            "completed" => "Goal Completed",
            "at_risk" => "Goal At Risk",
            "overdue" => "Goal Overdue",
            "milestone" => "Milestone Reached",
            _ => NotificationType
        };

        [NotMapped]
        public string StatusDisplay => IsPending ? "Pending" : IsRead ? "Read" : "Unread";
    }
}
