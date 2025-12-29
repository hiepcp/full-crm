using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Email entity representing email messages
    /// </summary>
    [Table("crm_email")]
    public class Email : BaseEntity
    {
        // === Primary Key (Auto-increment) ===
        public long Id { get; set; }

        // === External Mail ID ===
        public string? MailId { get; set; }

        // === Email Metadata ===
        public string? ConversationId { get; set; }
        public string? Subject { get; set; }
        public string? BodyPreview { get; set; }
        public string? BodyContent { get; set; }
        public string BodyContentType { get; set; } = "text";
        public string Importance { get; set; } = "normal";
        public bool HasAttachments { get; set; }
        public bool IsRead { get; set; }
        public bool IsDraft { get; set; }

        // === Sender Information ===
        public string? FromName { get; set; }
        public string? FromAddress { get; set; }
        public string? SenderName { get; set; }
        public string? SenderAddress { get; set; }

        // === Recipients ===
        public string? ToRecipients { get; set; } // JSON array
        public string? CcRecipients { get; set; } // JSON array
        public string? BccRecipients { get; set; } // JSON array
        public string? ReplyTo { get; set; } // JSON

        // === Timestamps ===
        public DateTime? ReceivedDateTime { get; set; }
        public DateTime? SentDateTime { get; set; }
        public DateTime CreatedDateTime { get; set; }
        public DateTime? LastModifiedDateTime { get; set; }

        // === External References ===
        public string? InternetMessageId { get; set; }

        // === CRM Integration ===
        public long? ActivityId { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public bool IsHighImportance => Importance == "high";
        [NotMapped]
        public bool IsNormalImportance => Importance == "normal";
        [NotMapped]
        public bool IsLowImportance => Importance == "low";
        [NotMapped]
        public string DisplaySubject => !string.IsNullOrEmpty(Subject) ? Subject : "No Subject";
        [NotMapped]
        public string DisplaySender => !string.IsNullOrEmpty(FromName) ? FromName : FromAddress ?? "Unknown Sender";
        [NotMapped]
        public bool IsSyncedToActivity => ActivityId.HasValue;
        [NotMapped]
        public bool CanBeSynced => !IsSyncedToActivity && !IsDraft;
        [NotMapped]
        public TimeSpan? Age => DateTime.UtcNow - (ReceivedDateTime ?? SentDateTime ?? CreatedDateTime);

        // === Business Logic Helpers ===
        [NotMapped]
        public bool IsIncoming => ReceivedDateTime.HasValue;
        [NotMapped]
        public bool IsOutgoing => SentDateTime.HasValue && !ReceivedDateTime.HasValue;
        [NotMapped]
        public bool HasMultipleRecipients => GetRecipientCount() > 1;
        [NotMapped]
        public bool IsRecent => Age.HasValue && Age.Value.TotalHours < 24;

        private int GetRecipientCount()
        {
            // Simple count based on JSON structure - could be improved
            var count = 0;
            if (!string.IsNullOrEmpty(ToRecipients)) count++;
            if (!string.IsNullOrEmpty(CcRecipients)) count++;
            if (!string.IsNullOrEmpty(BccRecipients)) count++;
            return count;
        }

        /// <summary>
        /// Mark email as read
        /// </summary>
        public void MarkAsRead()
        {
            IsRead = true;
        }

        /// <summary>
        /// Mark email as unread
        /// </summary>
        public void MarkAsUnread()
        {
            IsRead = false;
        }

        /// <summary>
        /// Change importance with validation
        /// </summary>
        public bool ChangeImportance(string newImportance)
        {
            var validImportances = new[] { "low", "normal", "high" };
            if (!validImportances.Contains(newImportance))
                return false;

            Importance = newImportance;
            return true;
        }

        /// <summary>
        /// Sync to activity
        /// </summary>
        public void SyncToActivity(long activityId)
        {
            ActivityId = activityId;
        }

        /// <summary>
        /// Remove sync from activity
        /// </summary>
        public void RemoveSync()
        {
            ActivityId = null;
        }
    }
}
