using CRMSys.Application.Dtos.Response;
using CRMSys.Domain.Enums;
using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Create Email Template request DTO
    /// </summary>
    public class CreateEmailTemplateRequest
    {
        [Required(ErrorMessage = "Template name is required")]
        [StringLength(255, ErrorMessage = "Name cannot exceed 255 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject is required")]
        [StringLength(500, ErrorMessage = "Subject cannot exceed 500 characters")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email body is required")]
        public string Body { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Category is required")]
        public EmailTemplateCategory Category { get; set; }

        public bool IsShared { get; set; } = false;
    }

    /// <summary>
    /// Update Email Template request DTO
    /// </summary>
    public class UpdateEmailTemplateRequest
    {
        [Required(ErrorMessage = "Template name is required")]
        [StringLength(255, ErrorMessage = "Name cannot exceed 255 characters")]
        public string Name { get; set; } = string.Empty;

        [Required(ErrorMessage = "Subject is required")]
        [StringLength(500, ErrorMessage = "Subject cannot exceed 500 characters")]
        public string Subject { get; set; } = string.Empty;

        [Required(ErrorMessage = "Email body is required")]
        public string Body { get; set; } = string.Empty;

        [StringLength(1000, ErrorMessage = "Description cannot exceed 1000 characters")]
        public string? Description { get; set; }

        [Required(ErrorMessage = "Category is required")]
        public EmailTemplateCategory Category { get; set; } 

        public bool IsShared { get; set; } = false;
        public bool IsActive { get; set; } = true;
    }

    /// <summary>
    /// Create Email Template attachment request DTO
    /// </summary>
    public class CreateEmailTemplateAttachmentRequest
    {
        [Required(ErrorMessage = "File name is required")]
        public string FileName { get; set; } = string.Empty;

        [Required(ErrorMessage = "File content is required")]
        public string FileContent { get; set; } = string.Empty; // Base64

        [Required(ErrorMessage = "File size is required")]
        public long FileSize { get; set; }

        [Required(ErrorMessage = "File type is required")]
        public string FileType { get; set; } = string.Empty;

        public string AttachmentType { get; set; } = "attachment";
        public string? ContentId { get; set; }
        public int DisplayOrder { get; set; } = 0;
    }

    /// <summary>
    /// Use Email Template request DTO (for sending emails)
    /// </summary>
    public class UseEmailTemplateRequest
    {
        [Required(ErrorMessage = "Template ID is required")]
        public long TemplateId { get; set; }

        [Required(ErrorMessage = "Recipient email is required")]
        [EmailAddress(ErrorMessage = "Invalid email address")]
        public string RecipientEmail { get; set; } = string.Empty;

        public string? EntityType { get; set; } // 'lead', 'deal', 'contact', etc.
        public long? EntityId { get; set; }

        // Variable replacements (key-value pairs for {{variable_name}})
        public Dictionary<string, string>? VariableValues { get; set; }
    }

    /// <summary>
    /// Render Email Template request DTO (preview with variables replaced)
    /// </summary>
    public class RenderEmailTemplateRequest
    {
        [Required(ErrorMessage = "Template ID is required")]
        public long TemplateId { get; set; }

        public string? EntityType { get; set; }
        public long? EntityId { get; set; }

        // Variable replacements for preview
        public Dictionary<string, string>? VariableValues { get; set; }
    }

    /// <summary>
    /// Rendered email template response
    /// </summary>
    public class RenderedEmailTemplateResponse
    {
        public long TemplateId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
    }

    /// <summary>
    /// Email Template query/filter request
    /// </summary>
    public class EmailTemplateQueryRequest : BaseQueryRequest
    {
        public EmailTemplateCategory? Category { get; set; }
        public string? SearchKeyword { get; set; }
        public bool? IsShared { get; set; }
        public bool? IsActive { get; set; }
        public string? FilterType { get; set; } // 'all', 'my', 'shared'
    }
}
