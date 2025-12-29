namespace CRMSys.Application.Dtos.Notification;

/// <summary>
/// Context information for notification generation
/// </summary>
public class NotificationContext
{
    /// <summary>
    /// Type of event that triggered notification (CREATED, UPDATED, DELETED, etc.)
    /// </summary>
    public string EventType { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of activity if entity is activity (meeting, call, email, internal_note, etc.)
    /// </summary>
    public string? ActivityType { get; set; }
    
    /// <summary>
    /// Additional metadata for custom business rules
    /// </summary>
    public Dictionary<string, object> Metadata { get; set; } = new();
}
