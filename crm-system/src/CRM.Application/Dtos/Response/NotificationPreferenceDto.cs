namespace CRMSys.Application.Dtos.Response;

/// <summary>
/// Notification preference DTO
/// </summary>
public class NotificationPreferenceDto
{
    public long Id { get; set; }
    public long UserId { get; set; }
    
    public bool InAppEnabled { get; set; }
    public bool EmailEnabled { get; set; }
    
    public bool LeadNotifications { get; set; }
    public bool DealNotifications { get; set; }
    public bool CustomerNotifications { get; set; }
    public bool ActivityNotifications { get; set; }
    public bool MentionNotifications { get; set; }
    
    public bool NotifyRelatedDealChanges { get; set; }
    public bool NotifyRelatedCustomerChanges { get; set; }
    
    public string MinimumSeverity { get; set; } = "MEDIUM";
    
    public TimeSpan? DoNotDisturbStart { get; set; }
    public TimeSpan? DoNotDisturbEnd { get; set; }
}
