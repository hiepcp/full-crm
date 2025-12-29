using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("crm_sharepoint_files")]
    public class CRMSharepointFile : BaseEntity
    {
        [Key]
        public long Id { get; set; }                  // AUTO_INCREMENT PK

        // Thông tin file SharePoint
        public string ItemId { get; set; } = null!;   // item_id
        public string DriveId { get; set; } = null!;  // drive_id
        public string Name { get; set; } = null!;     // name
        public string? WebUrl { get; set; }           // web_url
        public string? DownloadUrl { get; set; }      // download_url

        // Metadata cơ bản
        public string? MimeType { get; set; }         // mime_type
        public long? Size { get; set; }               // size
        public string? ETag { get; set; }             // etag
        public string? CTag { get; set; }             // ctag        

        // Người tạo / sửa        
        public DateTime? CreatedDateTime { get; set; } // created_datetime
        public string? LastModifiedBy { get; set; }   // last_modified_by
        public DateTime? LastModifiedDateTime { get; set; } // last_modified_datetime

        // Thông tin thư mục cha
        public string? ParentId { get; set; }         // parent_id
        public string? ParentName { get; set; }       // parent_name
        public string? ParentPath { get; set; }       // parent_path

        // JSON gốc
        public string? RawJson { get; set; }          // raw_json        
    }
}
