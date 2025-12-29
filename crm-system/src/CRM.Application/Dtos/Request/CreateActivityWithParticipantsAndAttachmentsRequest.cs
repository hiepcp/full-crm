using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Orchestrated request to create an Activity together with its Participants and Attachments
    /// in a single transactional operation.
    /// </summary>
    public class CreateActivityWithParticipantsAndAttachmentsRequest
    {
        [Required]
        public CreateActivityRequest Activity { get; set; } = default!;

        public List<ParticipantInput>? Participants { get; set; }

        public List<string>? EmailRecipients { get; set; }
    }

    /// <summary>
    /// Input for creating activity participants
    /// </summary>
    public class ParticipantInput
    {
        public long? ContactId { get; set; }
        public long? UserId { get; set; }
        public string Role { get; set; } = "attendee";
    }
}




