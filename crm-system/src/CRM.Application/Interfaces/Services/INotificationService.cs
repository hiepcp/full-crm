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
    Task<List<NotificationDto>> GetUserNotificationsAsync(string userEmail, int skip = 0, int take = 50);
    Task<int> GetUnreadCountAsync(string userEmail);
    
    // Mark as read
    Task MarkAsReadAsync(string notificationId, string userEmail);
    Task MarkAllAsReadAsync(string userEmail);
    
    // Delete
    Task<bool> DeleteAsync(string notificationId, string userEmail);
}
