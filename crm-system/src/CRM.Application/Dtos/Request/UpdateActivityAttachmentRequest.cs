namespace CRMSys.Application.Dtos.Request
{
    public class UpdateActivityAttachmentRequest
    {
        public string? FileName { get; set; }
        public string? FilePath { get; set; }
        public long? FileSize { get; set; }
        public string? MimeType { get; set; }
    }
}

