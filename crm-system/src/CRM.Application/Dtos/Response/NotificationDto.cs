namespace CRMSys.Application.Dtos.Response;

/// <summary>
/// Notification DTO for API responses
/// </summary>
public class NotificationDto
{
    public string Id { get; set; } = string.Empty;
    public long UserId { get; set; }
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    
    public string? EntityType { get; set; }
    public long? EntityId { get; set; }
    
    public bool IsRead { get; set; }
    public DateTime? ReadAt { get; set; }
    
    public string Severity { get; set; } = "INFO";
    public string? ActionUrl { get; set; }
    public string? Metadata { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public string? CreatedBy { get; set; }
}
