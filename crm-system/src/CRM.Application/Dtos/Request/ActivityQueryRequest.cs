namespace CRMSys.Application.Dtos.Request
{
    public class ActivityQueryRequest : BaseQueryRequest
    {
        public string? ActivityType { get; set; }
        public string? Status { get; set; }
        public string? Priority { get; set; }
        public string? AssignedTo { get; set; }
        public string? RelationType { get; set; }
        public long? RelationId { get; set; }
        public DateTime? DueAtFrom { get; set; }
        public DateTime? DueAtTo { get; set; }
        public DateTime? CompletedAtFrom { get; set; }
        public DateTime? CompletedAtTo { get; set; }
        public string? CreatedBy { get; set; }
    }
}
