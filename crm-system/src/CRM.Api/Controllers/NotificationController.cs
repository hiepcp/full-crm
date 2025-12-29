using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using Serilog;
using Shared.AuthN.Common;

namespace CRMSys.Api.Controllers;

/// <summary>
/// Notification management endpoints
/// </summary>
[ApiController]
[Route("api/notifications")]
[Authorize]
public class NotificationController : ControllerBase
{
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationController> _logger;
    private readonly IUserService _userService;

    /// <summary>
    /// Constructor
    /// </summary>
    public NotificationController(
        INotificationService notificationService,
        ILogger<NotificationController> logger,
        IUserService userService)
    {
        _notificationService = notificationService;
        _logger = logger;
        _userService = userService;
    }

    private long GetCurrentUserId()
    {
        var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
        try
        {
            var user = _userService.GetByEmailAsync(userEmail).Result;
            if (user == null)
            {
                _logger.LogWarning($"User not found for email {userEmail}");
                throw new InvalidOperationException($"User not found for email {userEmail}");
            }
            return user.Id;
        }
        catch (Exception ex)
        {
            _logger.LogWarning($"Failed to get user {userEmail}, {ex}");
            throw;
        }
    }

    /// <summary>
    /// Get user's notifications (paginated)
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<ApiResponse<List<NotificationDto>>>> GetNotifications(
        [FromQuery] int skip = 0,
        [FromQuery] int take = 50)
    {
        try
        {
            var userId = GetCurrentUserId();
            var notifications = await _notificationService.GetUserNotificationsAsync(userId, skip, take);

            return Ok(ApiResponse<List<NotificationDto>>.Ok(
                notifications,
                $"Retrieved {notifications.Count} notifications"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting notifications");
            return StatusCode(500, ApiResponse<List<NotificationDto>>.Fail("Failed to get notifications"));
        }
    }

    /// <summary>
    /// Get unread notification count
    /// </summary>
    [HttpGet("unread-count")]
    public async Task<ActionResult<ApiResponse<int>>> GetUnreadCount()
    {
        try
        {
            var userId = GetCurrentUserId();
            var count = await _notificationService.GetUnreadCountAsync(userId);

            return Ok(ApiResponse<int>.Ok(count, $"Unread count: {count}"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting unread count");
            return StatusCode(500, ApiResponse<int>.Fail("Failed to get unread count"));
        }
    }

    /// <summary>
    /// Mark notification as read
    /// </summary>
    [HttpPut("{id}/mark-read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAsRead(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _notificationService.MarkAsReadAsync(id, userId);

            return Ok(ApiResponse<bool>.Ok(true, "Notification marked as read"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking notification as read");
            return StatusCode(500, ApiResponse<bool>.Fail("Failed to mark as read"));
        }
    }

    /// <summary>
    /// Mark all notifications as read
    /// </summary>
    [HttpPut("mark-all-read")]
    public async Task<ActionResult<ApiResponse<bool>>> MarkAllAsRead()
    {
        try
        {
            var userId = GetCurrentUserId();
            await _notificationService.MarkAllAsReadAsync(userId);

            return Ok(ApiResponse<bool>.Ok(true, "All notifications marked as read"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error marking all as read");
            return StatusCode(500, ApiResponse<bool>.Fail("Failed to mark all as read"));
        }
    }

    /// <summary>
    /// Delete a notification
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<ApiResponse<bool>>> DeleteNotification(string id)
    {
        try
        {
            var userId = GetCurrentUserId();
            var success = await _notificationService.DeleteAsync(id, userId);

            if (!success)
            {
                return NotFound(ApiResponse<bool>.Fail("Notification not found or unauthorized"));
            }

            return Ok(ApiResponse<bool>.Ok(true, "Notification deleted"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting notification {Id}", id);
            return StatusCode(500, ApiResponse<bool>.Fail("Failed to delete notification"));
        }
    }

    /// <summary>
    /// Get user notification preferences
    /// </summary>
    [HttpGet("preferences")]
    public async Task<ActionResult<ApiResponse<NotificationPreferenceDto>>> GetPreferences()
    {
        try
        {
            var userId = GetCurrentUserId();
            var preferences = await _notificationService.GetUserPreferencesAsync(userId);

            return Ok(ApiResponse<NotificationPreferenceDto>.Ok(
                preferences,
                "Preferences retrieved"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting preferences");
            return StatusCode(500, ApiResponse<NotificationPreferenceDto>.Fail("Failed to get preferences"));
        }
    }

    /// <summary>
    /// Update user notification preferences
    /// </summary>
    [HttpPut("preferences")]
    public async Task<ActionResult<ApiResponse<bool>>> UpdatePreferences(
        [FromBody] NotificationPreferenceDto preferences)
    {
        try
        {
            var userId = GetCurrentUserId();
            await _notificationService.UpdateUserPreferencesAsync(userId, preferences);

            return Ok(ApiResponse<bool>.Ok(true, "Preferences updated"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating preferences");
            return StatusCode(500, ApiResponse<bool>.Fail("Failed to update preferences"));
        }
    }

    /// <summary>
    /// Test endpoint - send a test notification to yourself
    /// </summary>
    [HttpPost("test")]
    public async Task<ActionResult<ApiResponse<NotificationDto>>> SendTestNotification()
    {
        try
        {
            var userId = GetCurrentUserId();            var userEmail = User?.Claims.FirstOrDefault(c => c.Type == "email")?.Value ?? "system@crm.com";
            var notification = new NotificationDto
            {
                UserId = userId,
                Type = "TEST_NOTIFICATION",
                Title = "Test Notification",
                Message = "This is a test notification from the CRM system",
                Severity = "INFO",
                CreatedBy = userEmail
            };

            var result = await _notificationService.CreateAndSendAsync(notification);

            return Ok(ApiResponse<NotificationDto>.Ok(result, "Test notification sent"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending test notification");
            return StatusCode(500, ApiResponse<NotificationDto>.Fail("Failed to send test notification"));
        }
    }
}
