namespace CRMSys.Domain.Entities;

/// <summary>
/// Notification entity - stores all user notifications
/// </summary>
public class Notification
{
    public string Id { get; set; } = Guid.NewGuid().ToString();
    public long UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    
    // Entity reference
    public string? EntityType { get; set; }
    public long? EntityId { get; set; }
    
    // Status
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    
    // UI metadata

    public string? Metadata { get; set; } // JSON string
    
    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? CreatedBy { get; set; }
    public DateTime? UpdatedAt { get; set; }
}
