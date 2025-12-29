namespace CRMSys.Application.Dtos.Request
{
    public class AppointmentQueryRequest : BaseQueryRequest
    {
        public string? MailId { get; set; }
        public string? ICalUId { get; set; }
        public string? ConversationId { get; set; }
        public long? ActivityId { get; set; }
        public DateTime? StartFrom { get; set; }
        public DateTime? StartTo { get; set; }
        public DateTime? EndFrom { get; set; }
        public DateTime? EndTo { get; set; }
    }
}



