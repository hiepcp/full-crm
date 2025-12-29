using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("crm_appointment")]
    public class Appointment : BaseEntity
    {
        public long Id { get; set; }

        // External identifiers
        public string? MailId { get; set; }
        public string? ICalUId { get; set; }
        public string? ConversationId { get; set; }

        // Content
        public string? Subject { get; set; }
        public string? BodyPreview { get; set; }
        public string? BodyContent { get; set; }
        public string BodyContentType { get; set; } = "html";

        // Organizer
        public string? OrganizerName { get; set; }
        public string? OrganizerAddress { get; set; }

        // Participants (JSON)
        public string? Attendees { get; set; }

        // Timing
        public DateTime StartDateTime { get; set; }
        public DateTime? EndDateTime { get; set; }
        public string? StartTimeZone { get; set; }
        public string? EndTimeZone { get; set; }
        public int? DurationMinutes { get; set; }

        // Location / online info
        public string? LocationName { get; set; }
        public string? LocationAddress { get; set; }
        public bool IsOnlineMeeting { get; set; }
        public string? JoinUrl { get; set; }
        public string? Platform { get; set; }
        public string? ShowAs { get; set; }

        // Misc
        public string Importance { get; set; } = "normal";
        public string? Status { get; set; }
        public bool HasAttachments { get; set; }
        public DateTime? LastModifiedDateTime { get; set; }

        // Link to CRM
        public long? ActivityId { get; set; }
    }
}

