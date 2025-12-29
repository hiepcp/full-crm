namespace CRMSys.Application.Dtos.Notification;

/// <summary>
/// Represents a deduplicated notification recipient with aggregated roles
/// </summary>
public class NotificationRecipient
{
    public long UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// All roles this user has for the notification (e.g., "activity_owner", "deal_collaborator")
    /// </summary>
    public HashSet<string> Roles { get; set; } = new();
    
    /// <summary>
    /// Primary role based on priority (highest priority role)
    /// </summary>
    public string PrimaryRole { get; set; } = string.Empty;
    
    /// <summary>
    /// Additional context information (e.g., parent entity IDs)
    /// </summary>
    public Dictionary<string, object> Context { get; set; } = new();
    
    /// <summary>
    /// Get user-friendly role display string
    /// </summary>
    public string GetRoleDisplay()
    {
        if (Roles.Count == 1)
            return Roles.First().Replace("_", " ");
        
        return $"{Roles.Count} roles: {string.Join(", ", Roles.Take(2).Select(r => r.Replace("_", " ")))}";
    }
}
