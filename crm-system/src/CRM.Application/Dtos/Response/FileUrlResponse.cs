namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO containing temporary signed URL for file access
    /// </summary>
    public class FileUrlResponse
    {
        /// <summary>
        /// Signed/temporary URL from Microsoft Graph API (expires in ~1 hour)
        /// </summary>
        public string Url { get; set; } = string.Empty;

        /// <summary>
        /// Timestamp when the URL expires (UTC)
        /// </summary>
        public DateTime ExpiresAt { get; set; }

        /// <summary>
        /// MIME type for rendering (e.g., "image/jpeg", "application/pdf")
        /// </summary>
        public string ContentType { get; set; } = string.Empty;

        /// <summary>
        /// Original filename for display/download
        /// </summary>
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// File size in bytes
        /// </summary>
        public long Size { get; set; }
    }
}
