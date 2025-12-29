namespace CRMSys.Application.Dtos.Request
{
    public class CreatePipelineLogRequest
    {
        // === Relations ===
        public long DealId { get; set; }

        // === Pipeline Change Information ===
        public string? OldStage { get; set; }
        public string NewStage { get; set; } = string.Empty;
        public string? ChangedBy { get; set; }
        public DateTime? ChangedAt { get; set; }
        public string? Notes { get; set; }
    }
}
