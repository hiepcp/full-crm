using Microsoft.AspNetCore.Http;
using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    public class UploadFileRequest
    {
        [Required]
        public IFormFile File { get; set; } = null!;

        /// <summary>
        /// Optional custom file name to use when uploading to SharePoint
        /// </summary>
        public string FileName { get; set; } = string.Empty;

        /// <summary>
        /// Đường dẫn folder trong SharePoint (ví dụ: DEV/CRMiance)
        /// </summary>
        public string FolderPath { get; set; } = "";
    }

}
