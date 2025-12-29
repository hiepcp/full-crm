using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Services;

/// <summary>
/// Service for pushing notifications to clients in real-time
/// </summary>
public interface INotificationPushService
{
    /// <summary>
    /// Send notification to specific user via real-time channel (SignalR)
    /// </summary>
    Task SendToUserAsync(long userId, NotificationDto notification);

    /// <summary>
    /// Send unread count update to specific user
    /// </summary>
    Task SendUnreadCountUpdateAsync(long userId, int unreadCount);
}
