namespace CRMSys.Application.Dtos.Request
{
    public class CreateAppointmentRequest
    {
        public string? MailId { get; set; }
        public string? ICalUId { get; set; }
        public string? ConversationId { get; set; }
        public string? Subject { get; set; }
        public string? BodyPreview { get; set; }
        public string? BodyContent { get; set; }
        public string BodyContentType { get; set; } = "html";
        public string? OrganizerName { get; set; }
        public string? OrganizerAddress { get; set; }
        public string? Attendees { get; set; }
        public DateTime StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public string? StartTimeZone { get; set; }
        public string? EndTimeZone { get; set; }
        public int? DurationMinutes { get; set; }
        public string? LocationName { get; set; }
        public string? LocationAddress { get; set; }
        public bool IsOnlineMeeting { get; set; }
        public string? JoinUrl { get; set; }
        public string? Platform { get; set; }
        public string? ShowAs { get; set; }
        public string Importance { get; set; } = "normal";
        public string? Status { get; set; }
        public bool HasAttachments { get; set; }
        public DateTime? LastModifiedDateTime { get; set; }
        public long? ActivityId { get; set; }
    }
}
