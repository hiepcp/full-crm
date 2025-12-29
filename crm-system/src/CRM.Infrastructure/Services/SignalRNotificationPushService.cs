using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Infrastructure.Hubs;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace CRMSys.Infrastructure.Services;

/// <summary>
/// SignalR implementation of notification push service
/// </summary>
public class SignalRNotificationPushService : INotificationPushService
{
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly ILogger<SignalRNotificationPushService> _logger;

    public SignalRNotificationPushService(
        IHubContext<NotificationHub> hubContext,
        ILogger<SignalRNotificationPushService> logger)
    {
        _hubContext = hubContext;
        _logger = logger;
    }

    public async Task SendToUserAsync(long userId, NotificationDto notification)
    {
        var groupName = $"user_{userId}";
        
        _logger.LogInformation(
            "SignalRPush: Sending notification to group '{GroupName}' for UserId={UserId}. NotificationId={NotificationId}, Title={Title}",
            groupName, userId, notification.Id, notification.Title);

        await _hubContext.Clients
            .Group(groupName)
            .SendAsync("ReceiveNotification", notification);
        
        _logger.LogInformation(
            "SignalRPush: Notification sent to group '{GroupName}'",
            groupName);
    }

    public async Task SendUnreadCountUpdateAsync(long userId, int unreadCount)
    {
        var groupName = $"user_{userId}";
        
        _logger.LogInformation(
            "SignalRPush: Sending unread count update to group '{GroupName}'. Count={Count}",
            groupName, unreadCount);

        await _hubContext.Clients
            .Group(groupName)
            .SendAsync("UnreadCountUpdated", unreadCount);
    }
}
