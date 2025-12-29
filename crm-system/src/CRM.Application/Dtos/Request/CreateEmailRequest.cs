namespace CRMSys.Application.Dtos.Request
{
    public class CreateEmailRequest
    {
        public string? MailId { get; set; }
        public string? ConversationId { get; set; }
        public string? Subject { get; set; }
        public string? BodyPreview { get; set; }
        public string? BodyContent { get; set; }
        public string BodyContentType { get; set; } = "text";
        public string Importance { get; set; } = "normal";
        public bool HasAttachments { get; set; }
        public bool IsRead { get; set; }
        public bool IsDraft { get; set; }
        public string? FromName { get; set; }
        public string? FromAddress { get; set; }
        public string? SenderName { get; set; }
        public string? SenderAddress { get; set; }
        public string? ToRecipients { get; set; }
        public string? CcRecipients { get; set; }
        public string? BccRecipients { get; set; }
        public string? ReplyTo { get; set; }
        public DateTime? ReceivedDateTime { get; set; }
        public DateTime? SentDateTime { get; set; }
        public DateTime CreatedDateTime { get; set; }
        public DateTime? LastModifiedDateTime { get; set; }
        public string? InternetMessageId { get; set; }
        public long? ActivityId { get; set; }
    }
}
