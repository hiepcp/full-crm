namespace CRMSys.Application.Dtos.Request
{
    public class PipelineLogQueryRequest : BaseQueryRequest
    {
        public long? DealId { get; set; }
        public string? OldStage { get; set; }
        public string? NewStage { get; set; }
        public string? ChangedBy { get; set; }
        public DateTime? ChangedAtFrom { get; set; }
        public DateTime? ChangedAtTo { get; set; }
        public DateTime? CreatedOnFrom { get; set; }
        public DateTime? CreatedOnTo { get; set; }
    }
}
