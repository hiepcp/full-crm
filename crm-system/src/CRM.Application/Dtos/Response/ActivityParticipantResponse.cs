namespace CRMSys.Application.Dtos.Response
{
    public class ActivityParticipantResponse
    {
        public long Id { get; set; }
        public long ActivityId { get; set; }
        public long? ContactId { get; set; }
        public long? UserId { get; set; }
        public string Role { get; set; } = "attendee";

        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }
    }
}

