using CRMSys.Application.Dtos.Notification;
using CRMSys.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace CRMSys.Application.Services;

/// <summary>
/// Orchestrator implementation that coordinates all notification components
/// Entry point for triggering notifications from domain events
/// </summary>
public class NotificationOrchestrator : INotificationOrchestrator
{
    private readonly INotificationRulesEngine _rulesEngine;
    private readonly INotificationBuilder _notificationBuilder;
    private readonly INotificationService _notificationService;
    private readonly ILogger<NotificationOrchestrator> _logger;

    public NotificationOrchestrator(
        INotificationRulesEngine rulesEngine,
        INotificationBuilder notificationBuilder,
        INotificationService notificationService,
        ILogger<NotificationOrchestrator> logger)
    {
        _rulesEngine = rulesEngine;
        _notificationBuilder = notificationBuilder;
        _notificationService = notificationService;
        _logger = logger;
    }

    public async Task NotifyEntityChangeAsync(
        string entityType,
        long entityId,
        NotificationContext context,
        object? entityData = null)
    {
        try
        {
            _logger.LogInformation(
                "Starting notification orchestration for {EntityType} {EntityId}, EventType: {EventType}",
                entityType, entityId, context.EventType);

            // Step 1: Determine recipients (with deduplication & business rules)
            var recipients = await _rulesEngine.DetermineRecipientsAsync(
                entityType, entityId, context);

            if (recipients.Count == 0)
            {
                _logger.LogInformation(
                    "No recipients found after applying business rules for {EntityType} {EntityId}",
                    entityType, entityId);
                return;
            }

            _logger.LogInformation(
                "Found {Count} unique recipients for {EntityType} {EntityId}",
                recipients.Count, entityType, entityId);

            // Step 2: Build customized notifications for each recipient
            var notifications = recipients
                .Select(recipient => _notificationBuilder.BuildNotification(
                    recipient, entityType, entityId, context, entityData))
                .ToList();

            // Step 3: Send notifications
            var successCount = 0;
            var failureCount = 0;

            foreach (var notification in notifications)
            {
                try
                {
                    await _notificationService.CreateAndSendAsync(notification);
                    successCount++;
                    
                    _logger.LogDebug(
                        "Notification sent to user {UserEmail} for {EntityType} {EntityId}",
                        notification.UserEmail, entityType, entityId);
                }
                catch (Exception ex)
                {
                    failureCount++;
                    _logger.LogError(ex,
                        "Failed to send notification to user {UserEmail} for {EntityType} {EntityId}",
                        notification.UserEmail, entityType, entityId);
                }
            }

            _logger.LogInformation(
                "Notification orchestration completed for {EntityType} {EntityId}. " +
                "Success: {SuccessCount}, Failed: {FailureCount}",
                entityType, entityId, successCount, failureCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Error in notification orchestration for {EntityType} {EntityId}",
                entityType, entityId);
            // Don't throw - notification failures shouldn't break main business logic
        }
    }
}
