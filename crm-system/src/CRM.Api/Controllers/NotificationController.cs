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
            var safeId = id?.Replace(Environment.NewLine, string.Empty)
                            .Replace("\n", string.Empty)
                            .Replace("\r", string.Empty);
            _logger.LogError(ex, "Error deleting notification {Id}", safeId);
            return StatusCode(500, ApiResponse<bool>.Fail("Failed to delete notification"));
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
            var userId = GetCurrentUserId();
            var userEmail = User?.Claims.FirstOrDefault(c => c.Type == "email")?.Value ?? "system@crm.com";
            var notification = new NotificationDto
            {
                UserId = userId,
                Type = "TEST_NOTIFICATION",
                Title = "Test Notification",
                Message = "This is a test notification from the CRM system",
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

    /// <summary>
    /// Manual trigger for daily follow-up reminders (for testing)
    /// </summary>
    [HttpPost("test/daily-reminders")]
    public async Task<IActionResult> TriggerDailyReminders()
    {
        try
        {
            _logger.LogInformation("Manual trigger for daily follow-up reminders");

            var userId = GetCurrentUserId();
            var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

            // Import necessary types
            using var scope = HttpContext.RequestServices.CreateScope();
            var leadRepository = scope.ServiceProvider.GetRequiredService<CRMSys.Application.Interfaces.Repositories.ILeadRepository>();
            var assigneeRepository = scope.ServiceProvider.GetRequiredService<CRMSys.Application.Interfaces.Repositories.IAssigneeRepository>();

            var today = DateTime.Today;
            var leads = await leadRepository.GetLeadsWithFollowUpDueAsync(today);
            var totalNotifications = 0;

            foreach (var lead in leads)
            {
                var assignees = await assigneeRepository.GetByRelationAsync("lead", lead.Id);
                var leadName = !string.IsNullOrEmpty(lead.Company)
                    ? lead.Company
                    : $"{lead.FirstName} {lead.LastName}".Trim();

                foreach (var assignment in assignees)
                {
                    var notification = new NotificationDto
                    {
                        UserId = assignment.UserId,
                        Type = "LEAD_FOLLOW_UP_DUE",
                        Title = "Lead follow-up due today",
                        Message = $"Follow-up is scheduled today for lead '{leadName}'",
                        EntityType = "lead",
                        EntityId = lead.Id,
                        Metadata = System.Text.Json.JsonSerializer.Serialize(new
                        {
                            entityId = lead.Id,
                            entityName = leadName,
                            entityType = "lead",
                            followUpDate = lead.FollowUpDate,
                            role = assignment.Role,
                            sentAt = DateTime.UtcNow,
                            reminderType = "MANUAL_TRIGGER"
                        }),
                        CreatedBy = userEmail
                    };

                    await _notificationService.CreateAndSendAsync(notification);
                    totalNotifications++;
                }
            }

            return Ok(ApiResponse<object>.Ok(
                new { 
                    leadCount = leads.Count(), 
                    notificationCount = totalNotifications,
                    date = today.ToString("yyyy-MM-dd")
                },
                $"Processed {leads.Count()} leads, sent {totalNotifications} notifications"
            ));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error triggering daily reminders");
            return StatusCode(500, ApiResponse<object>.Fail($"Failed to trigger daily reminders: {ex.Message}"));
        }
    }
}
