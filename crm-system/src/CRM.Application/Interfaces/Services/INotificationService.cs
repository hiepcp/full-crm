using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Services;

/// <summary>
/// Notification service interface
/// </summary>
public interface INotificationService
{
    // Create and send notification (event-driven)
    Task<NotificationDto> CreateAndSendAsync(NotificationDto notification);
    
    // Query notifications
    Task<List<NotificationDto>> GetUserNotificationsAsync(long userId, int skip = 0, int take = 50);
    Task<int> GetUnreadCountAsync(long userId);
    
    // Mark as read
    Task MarkAsReadAsync(string notificationId, long userId);
    Task MarkAllAsReadAsync(long userId);
    
    // Delete
    Task<bool> DeleteAsync(string notificationId, long userId);
    
    // Preferences
    Task<NotificationPreferenceDto> GetUserPreferencesAsync(long userId);
    Task UpdateUserPreferencesAsync(long userId, NotificationPreferenceDto preferences);
    
    // Helper methods
    Task<bool> ShouldSendNotificationAsync(long userId, string notificationType, string severity);
}
