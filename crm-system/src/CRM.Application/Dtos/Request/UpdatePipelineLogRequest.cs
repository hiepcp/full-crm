namespace CRMSys.Application.Dtos.Request
{
    public class UpdatePipelineLogRequest
    {
        // === Pipeline Change Information ===
        public string? OldStage { get; set; }
        public string NewStage { get; set; } = string.Empty;
        public string? ChangedBy { get; set; }
        public DateTime? ChangedAt { get; set; }
        public string? Notes { get; set; }
    }
}
