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
    private readonly INotificationPreferenceRepository _preferenceRepo;
    private readonly INotificationPushService _pushService;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(
        INotificationRepository notificationRepo,
        INotificationPreferenceRepository preferenceRepo,
        INotificationPushService pushService,
        ILogger<NotificationService> logger)
    {
        _notificationRepo = notificationRepo;
        _preferenceRepo = preferenceRepo;
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

            // Check if user wants this notification
            var shouldSend = await ShouldSendNotificationAsync(dto.UserId, dto.Type, dto.Severity);
            if (!shouldSend)
            {
                _logger.LogDebug("Notification filtered out by user preferences. UserId={UserId}, Type={Type}", 
                    dto.UserId, dto.Type);
                return dto;
            }

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
                Severity = dto.Severity,
                ActionUrl = dto.ActionUrl,
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

    public async Task<NotificationPreferenceDto> GetUserPreferencesAsync(long userId)
    {
        var preference = await _preferenceRepo.GetByUserIdAsync(userId);
        
        // Create default if not exists
        if (preference == null)
        {
            preference = new NotificationPreference
            {
                UserId = userId,
                InAppEnabled = true,
                EmailEnabled = false,
                LeadNotifications = true,
                DealNotifications = true,
                CustomerNotifications = true,
                ActivityNotifications = true,
                MentionNotifications = true,
                NotifyRelatedDealChanges = true,
                NotifyRelatedCustomerChanges = true,
                MinimumSeverity = "MEDIUM"
            };
            
            preference = await _preferenceRepo.CreateAsync(preference);
        }

        return MapToPreferenceDto(preference);
    }

    public async Task UpdateUserPreferencesAsync(long userId, NotificationPreferenceDto dto)
    {
        var existing = await _preferenceRepo.GetByUserIdAsync(userId);
        if (existing == null)
        {
            throw new InvalidOperationException($"Preferences not found for user {userId}");
        }

        existing.InAppEnabled = dto.InAppEnabled;
        existing.EmailEnabled = dto.EmailEnabled;
        existing.LeadNotifications = dto.LeadNotifications;
        existing.DealNotifications = dto.DealNotifications;
        existing.CustomerNotifications = dto.CustomerNotifications;
        existing.ActivityNotifications = dto.ActivityNotifications;
        existing.MentionNotifications = dto.MentionNotifications;
        existing.NotifyRelatedDealChanges = dto.NotifyRelatedDealChanges;
        existing.NotifyRelatedCustomerChanges = dto.NotifyRelatedCustomerChanges;
        existing.MinimumSeverity = dto.MinimumSeverity;
        existing.DoNotDisturbStart = dto.DoNotDisturbStart;
        existing.DoNotDisturbEnd = dto.DoNotDisturbEnd;
        existing.UpdatedAt = DateTime.UtcNow;

        await _preferenceRepo.UpdateAsync(existing);
    }

    public async Task<bool> ShouldSendNotificationAsync(long userId, string notificationType, string severity)
    {
        var preferences = await _preferenceRepo.GetByUserIdAsync(userId);
        if (preferences == null || !preferences.InAppEnabled)
        {
            return false;
        }

        // Check severity threshold
        if (!MeetsSeverityThreshold(severity, preferences.MinimumSeverity))
        {
            return false;
        }

        // Check Do Not Disturb
        if (IsInDoNotDisturbPeriod(preferences))
        {
            return false;
        }

        // Check type-specific toggles
        if (notificationType.Contains("LEAD") && !preferences.LeadNotifications) return false;
        if (notificationType.Contains("DEAL") && !preferences.DealNotifications) return false;
        if (notificationType.Contains("CUSTOMER") && !preferences.CustomerNotifications) return false;
        if (notificationType.Contains("ACTIVITY") && !preferences.ActivityNotifications) return false;
        if (notificationType.Contains("MENTION") && !preferences.MentionNotifications) return false;

        return true;
    }

    private bool MeetsSeverityThreshold(string actual, string minimum)
    {
        var levels = new Dictionary<string, int>
        {
            ["LOW"] = 1,
            ["INFO"] = 1,
            ["MEDIUM"] = 2,
            ["WARNING"] = 2,
            ["HIGH"] = 3,
            ["ERROR"] = 3,
            ["CRITICAL"] = 4,
            ["SUCCESS"] = 2
        };

        var actualLevel = levels.GetValueOrDefault(actual.ToUpper(), 1);
        var minimumLevel = levels.GetValueOrDefault(minimum.ToUpper(), 1);

        return actualLevel >= minimumLevel;
    }

    private bool IsInDoNotDisturbPeriod(NotificationPreference preferences)
    {
        if (!preferences.DoNotDisturbStart.HasValue || !preferences.DoNotDisturbEnd.HasValue)
        {
            return false;
        }

        var now = DateTime.Now.TimeOfDay;
        var start = preferences.DoNotDisturbStart.Value;
        var end = preferences.DoNotDisturbEnd.Value;

        // Handle overnight period (e.g., 22:00 - 08:00)
        if (start > end)
        {
            return now >= start || now <= end;
        }

        return now >= start && now <= end;
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
            Severity = entity.Severity,
            ActionUrl = entity.ActionUrl,
            Metadata = entity.Metadata,
            CreatedAt = entity.CreatedAt,
            CreatedBy = entity.CreatedBy
        };
    }

    private NotificationPreferenceDto MapToPreferenceDto(NotificationPreference entity)
    {
        return new NotificationPreferenceDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            InAppEnabled = entity.InAppEnabled,
            EmailEnabled = entity.EmailEnabled,
            LeadNotifications = entity.LeadNotifications,
            DealNotifications = entity.DealNotifications,
            CustomerNotifications = entity.CustomerNotifications,
            ActivityNotifications = entity.ActivityNotifications,
            MentionNotifications = entity.MentionNotifications,
            NotifyRelatedDealChanges = entity.NotifyRelatedDealChanges,
            NotifyRelatedCustomerChanges = entity.NotifyRelatedCustomerChanges,
            MinimumSeverity = entity.MinimumSeverity,
            DoNotDisturbStart = entity.DoNotDisturbStart,
            DoNotDisturbEnd = entity.DoNotDisturbEnd
        };
    }
}
