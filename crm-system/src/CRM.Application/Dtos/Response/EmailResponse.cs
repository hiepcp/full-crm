namespace CRMSys.Application.Dtos.Response
{
    public class EmailResponse
    {
        // === Primary Key ===
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
        public string? ToRecipients { get; set; }
        public string? CcRecipients { get; set; }
        public string? BccRecipients { get; set; }
        public string? ReplyTo { get; set; }

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
        public bool IsHighImportance => Importance == "high";
        public bool IsNormalImportance => Importance == "normal";
        public bool IsLowImportance => Importance == "low";
        public string DisplaySubject => !string.IsNullOrEmpty(Subject) ? Subject : "No Subject";
        public string DisplaySender => !string.IsNullOrEmpty(FromName) ? FromName : FromAddress ?? "Unknown Sender";
        public bool IsSyncedToActivity => ActivityId.HasValue;
        public bool CanBeSynced => !IsSyncedToActivity && !IsDraft;
        public TimeSpan? Age => DateTime.UtcNow - (ReceivedDateTime ?? SentDateTime ?? CreatedDateTime);

        // === Business Logic Helpers ===
        public bool IsIncoming => ReceivedDateTime.HasValue;
        public bool IsOutgoing => SentDateTime.HasValue && !ReceivedDateTime.HasValue;
        public bool IsRecent => Age.HasValue && Age.Value.TotalHours < 24;
    }
}
