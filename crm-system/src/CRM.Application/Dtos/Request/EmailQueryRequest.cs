namespace CRMSys.Application.Dtos.Request
{
    public class EmailQueryRequest : BaseQueryRequest
    {
        public long? ActivityId { get; set; }
        public string? ConversationId { get; set; }
        public string? Subject { get; set; }
        public string? Importance { get; set; }
        public bool? IsRead { get; set; }
        public bool? IsDraft { get; set; }
        public bool? HasAttachments { get; set; }
        public string? FromAddress { get; set; }
        public string? SenderAddress { get; set; }
        public DateTime? ReceivedDateFrom { get; set; }
        public DateTime? ReceivedDateTo { get; set; }
        public DateTime? SentDateFrom { get; set; }
        public DateTime? SentDateTo { get; set; }
    }
}
