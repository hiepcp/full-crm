using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Microsoft.Extensions.Logging;

namespace CRMSys.Application.Services;

/// <summary>
/// Notification service implementation
/// </summary>
public class NotificationService : INotificationService
{
    private readonly INotificationRepository _notificationRepo;
    private readonly INotificationPushService _pushService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepo,
        INotificationPushService pushService,
        ILogger<NotificationService> logger)
    {
        _notificationRepo = notificationRepo;
        _pushService = pushService;
        _logger = logger;
    }

    public async Task<NotificationDto> CreateAndSendAsync(NotificationDto dto)
    {
        try
        {
            _logger.LogInformation(
                "CreateAndSendAsync: Starting to create notification for UserId={UserId}, Type={Type}",
                dto.UserId, dto.Type);

            // Create entity
            var notification = new Notification
            {
                Id = Guid.NewGuid().ToString(),
                UserId = dto.UserId,
                Type = dto.Type,
                Title = dto.Title,
                Message = dto.Message,
                EntityType = dto.EntityType,
                EntityId = dto.EntityId,
                IsRead = false,
                Metadata = dto.Metadata,
                CreatedAt = DateTime.UtcNow,
                CreatedBy = dto.CreatedBy
            };

            _logger.LogInformation(
                "CreateAndSendAsync: Saving notification to database. NotificationId={NotificationId}",
                notification.Id);

            // Save to database
            var saved = await _notificationRepo.CreateAsync(notification);

            _logger.LogInformation(
                "CreateAndSendAsync: Notification saved. Now sending via SignalR to UserId={UserId}",
                dto.UserId);

            // Send via SignalR
            var resultDto = MapToDto(saved);
            await _pushService.SendToUserAsync(dto.UserId, resultDto);

            _logger.LogInformation("Notification sent to user {UserId}: {Title}", dto.UserId, dto.Title);

            return resultDto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create and send notification for user {UserId}", dto.UserId);
            throw;
        }
    }

    public async Task<List<NotificationDto>> GetUserNotificationsAsync(long userId, int skip = 0, int take = 50)
    {
        var notifications = await _notificationRepo.GetByUserIdAsync(userId, skip, take);
        return notifications.Select(MapToDto).ToList();
    }

    public async Task<int> GetUnreadCountAsync(long userId)
    {
        return await _notificationRepo.GetUnreadCountAsync(userId);
    }

    public async Task MarkAsReadAsync(string notificationId, long userId)
    {
        var success = await _notificationRepo.MarkAsReadAsync(notificationId, userId);
        if (success)
        {
            // Notify client to update unread count
            var unreadCount = await GetUnreadCountAsync(userId);
            await _pushService.SendUnreadCountUpdateAsync(userId, unreadCount);
        }
    }

    public async Task MarkAllAsReadAsync(long userId)
    {
        await _notificationRepo.MarkAllAsReadAsync(userId);
        
        // Notify client
        await _pushService.SendUnreadCountUpdateAsync(userId, 0);
    }

    public async Task<bool> DeleteAsync(string notificationId, long userId)
    {
        try
        {
            var notification = await _notificationRepo.GetByIdAsync(notificationId);
            
            // Verify the notification belongs to the user
            if (notification == null || notification.UserId != userId)
            {
                _logger.LogWarning("Notification {Id} not found or doesn't belong to user {UserId}", 
                    notificationId, userId);
                return false;
            }

            var success = await _notificationRepo.DeleteAsync(notificationId, userId);
            
            if (success)
            {
                _logger.LogInformation("Notification {Id} deleted by user {UserId}", notificationId, userId);
                
                // Update unread count if it was unread
                if (!notification.IsRead)
                {
                    var unreadCount = await GetUnreadCountAsync(userId);
                    await _pushService.SendUnreadCountUpdateAsync(userId, unreadCount);
                }
            }
            
            return success;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to delete notification {Id}", notificationId);
            throw;
        }
    }

    private NotificationDto MapToDto(Notification entity)
    {
        return new NotificationDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            Type = entity.Type,
            Title = entity.Title,
            Message = entity.Message,
            EntityType = entity.EntityType,
            EntityId = entity.EntityId,
            IsRead = entity.IsRead,
            ReadAt = entity.ReadAt,
            Metadata = entity.Metadata,
            CreatedAt = entity.CreatedAt,
            CreatedBy = entity.CreatedBy
        };
    }
}
