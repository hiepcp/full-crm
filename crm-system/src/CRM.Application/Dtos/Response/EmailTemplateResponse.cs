using CRMSys.Domain.Enums;

namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Email Template response DTO
    /// </summary>
    public class EmailTemplateResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public DateTime? UpdatedOn { get; set; }

        // === Basic Information ===
        public string Name { get; set; } = string.Empty;
        public string Subject { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? Description { get; set; }

        // === Ownership & Sharing ===
        public string? CreatorEmail { get; set; }
        public bool IsShared { get; set; }
        public string AccessLevel => IsShared ? "Shared" : "Private";

        // === Template Metadata ===
        public EmailTemplateCategory Category { get; set; }

        // === Status & Tracking ===
        public bool IsActive { get; set; } = true;
        public int UsageCount { get; set; } = 0;
        public DateTime? LastUsedAt { get; set; }

        // === Permissions (for current user) ===
        public bool IsOwner { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
    }

    /// <summary>
    /// Email Template attachment response DTO
    /// </summary>
    public class EmailTemplateAttachmentResponse
    {
        public long Id { get; set; }
        public long TemplateId { get; set; }
        public string FileName { get; set; } = string.Empty;
        public string FileContent { get; set; } = string.Empty; // Base64
        public long FileSize { get; set; }
        public string FileType { get; set; } = string.Empty;
        public string AttachmentType { get; set; } = "attachment";
        public string? ContentId { get; set; }
        public int DisplayOrder { get; set; }
        public DateTime CreatedOn { get; set; }

        // Computed
        public string FileSizeFormatted
        {
            get
            {
                if (FileSize < 1024)
                    return $"{FileSize} B";
                if (FileSize < 1024 * 1024)
                    return $"{FileSize / 1024.0:F2} KB";
                return $"{FileSize / (1024.0 * 1024):F2} MB";
            }
        }
    }

    /// <summary>
    /// Email Template variable response DTO
    /// </summary>
    public class EmailTemplateVariableResponse
    {
        public long Id { get; set; }
        public string VariableKey { get; set; } = string.Empty;
        public string VariableName { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public string FieldPath { get; set; } = string.Empty;
        public string? ExampleValue { get; set; }
        public bool IsActive { get; set; } = true;
        public int DisplayOrder { get; set; }
    }

    /// <summary>
    /// Grouped variables response DTO
    /// </summary>
    public class GroupedVariablesResponse
    {
        public string EntityType { get; set; } = string.Empty;
        public List<EmailTemplateVariableResponse> Variables { get; set; } = new();
    }
}
