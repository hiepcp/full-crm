namespace CRMSys.Domain.Entities;

/// <summary>
/// User notification preferences
/// </summary>
public class NotificationPreference
{
    public long Id { get; set; }
    public long UserId { get; set; }
    
    // Global toggles
    public bool InAppEnabled { get; set; } = true;
    public bool EmailEnabled { get; set; } = false;
    
    // Type-specific toggles
    public bool LeadNotifications { get; set; } = true;
    public bool DealNotifications { get; set; } = true;
    public bool CustomerNotifications { get; set; } = true;
    public bool ActivityNotifications { get; set; } = true;
    public bool MentionNotifications { get; set; } = true;
    
    // Related entity notifications
    public bool NotifyRelatedDealChanges { get; set; } = true;
    public bool NotifyRelatedCustomerChanges { get; set; } = true;
    
    // Severity filter
    public string MinimumSeverity { get; set; } = "LOW";
    
    // Do Not Disturb
    public TimeSpan? DoNotDisturbStart { get; set; }
    public TimeSpan? DoNotDisturbEnd { get; set; }
    
    // Audit
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAt { get; set; }
}
