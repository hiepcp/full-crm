namespace CRMSys.Application.Dtos.Request
{
    public class CreateActivityParticipantRequest
    {
        public long ActivityId { get; set; }
        public long? ContactId { get; set; }
        public long? UserId { get; set; }
        public string Role { get; set; } = "attendee";
    }
}

