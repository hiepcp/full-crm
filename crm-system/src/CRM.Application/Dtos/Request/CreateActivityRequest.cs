namespace CRMSys.Application.Dtos.Request
{
    public class CreateActivityRequest
    {
        public string? ExternalId { get; set; }
        public string? ConversationId { get; set; }
        public string? SourceFrom { get; set; }
        public string? Subject { get; set; }
        public string? Body { get; set; }
        public string ActivityType { get; set; } = "note";
        public DateTime? DueAt { get; set; }
        public DateTime? StartAt { get; set; }
        public DateTime? EndAt { get; set; }
        public string Status { get; set; } = "open";
        public string Priority { get; set; } = "normal";
        public string? AssignedTo { get; set; }
        public string? RelationType { get; set; }
        public long? RelationId { get; set; }
        public int? CallDuration { get; set; }
        public string? CallOutcome { get; set; }
        public DateTime? ContractDate { get; set; }
        public decimal? ContractValue { get; set; }
    }
}
