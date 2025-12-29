using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// ActivityAttachment entity representing attachments to activities
    /// </summary>
    [Table("crm_activity_attachment")]
    public class ActivityAttachment : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Relations ===
        public long ActivityId { get; set; }
        public string IdRef { get; set; } = string.Empty;

        // === Attachment Details ===
        public string FileName { get; set; } = string.Empty;
        public string FilePath { get; set; } = string.Empty;
        public long FileSize { get; set; }
        public string MimeType { get; set; } = string.Empty;

        // === Computed Properties ===
        [NotMapped]
        public string FileExtension => GetFileExtension();
        [NotMapped]
        public bool IsImage => MimeType.StartsWith("image/", StringComparison.OrdinalIgnoreCase);
        [NotMapped]
        public bool IsDocument => MimeType.StartsWith("application/", StringComparison.OrdinalIgnoreCase) ||
                                 MimeType.StartsWith("text/", StringComparison.OrdinalIgnoreCase);
        [NotMapped]
        public string DisplaySize => FormatFileSize();
        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(FileName) ? FileName : $"Attachment {Id}";

        private string GetFileExtension()
        {
            var lastDotIndex = FileName.LastIndexOf('.');
            return lastDotIndex >= 0 ? FileName.Substring(lastDotIndex) : string.Empty;
        }

        private string FormatFileSize()
        {
            const long KB = 1024;
            const long MB = KB * 1024;
            const long GB = MB * 1024;

            if (FileSize >= GB)
                return $"{FileSize / (double)GB:F2} GB";
            else if (FileSize >= MB)
                return $"{FileSize / (double)MB:F2} MB";
            else if (FileSize >= KB)
                return $"{FileSize / (double)KB:F2} KB";
            else
                return $"{FileSize} bytes";
        }

        // === Business Logic Helpers ===
        [NotMapped]
        public bool IsValid => !string.IsNullOrEmpty(FileName) && !string.IsNullOrEmpty(FilePath) && FileSize > 0;
        [NotMapped]
        public bool CanBeDownloaded => IsValid && System.IO.File.Exists(FilePath);
    }
}
