namespace CRMSys.Application.Dtos.Notification;

/// <summary>
/// DTO representing an assignee with contextual information
/// Used by NotificationRecipientRepository to fetch assignee data
/// </summary>
public class AssigneeDto
{
    public long UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    
    /// <summary>
    /// Type of entity user is assigned to (activity, deal, lead, customer)
    /// </summary>
    public string EntityType { get; set; } = string.Empty;
    
    /// <summary>
    /// User's role in this entity (owner, collaborator)
    /// </summary>
    public string Role { get; set; } = string.Empty;
    
    /// <summary>
    /// Lead conversion status for filtering (Active, Converted, etc.)
    /// </summary>
    public string? LeadConversionStatus { get; set; }
    
    /// <summary>
    /// Deal status for filtering (Open, Closed, etc.)
    /// </summary>
    public string? DealStatus { get; set; }
    
    /// <summary>
    /// ID of parent entity if applicable
    /// </summary>
    public long? ParentEntityId { get; set; }
    
    /// <summary>
    /// Type of parent entity if applicable
    /// </summary>
    public string? ParentEntityType { get; set; }
}
