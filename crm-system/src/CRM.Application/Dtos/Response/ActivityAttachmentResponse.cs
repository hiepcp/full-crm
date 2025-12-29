namespace CRMSys.Application.Dtos.Response
{
    public class ActivityAttachmentResponse
    {
        public long Id { get; set; }
        public long ActivityId { get; set; }
        public string IdRef { get; set; } = string.Empty;
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;

        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }
    }
}

