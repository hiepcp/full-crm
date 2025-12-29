namespace CRMSys.Application.Dtos.Request
{
    public class CreateActivityAttachmentRequest
    {
        public long ActivityId { get; set; }
        public string? IdRef { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;
 
    }
}

