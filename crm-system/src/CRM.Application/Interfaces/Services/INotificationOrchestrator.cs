using CRMSys.Application.Dtos.Notification;

namespace CRMSys.Application.Interfaces.Services;

/// <summary>
/// Orchestrator service that coordinates the notification flow
/// High-level interface for triggering notifications
/// </summary>
public interface INotificationOrchestrator
{
    /// <summary>
    /// Notify about an entity change
    /// Automatically determines recipients, applies business rules, and sends notifications
    /// </summary>
    /// <param name="entityType">Type of entity (activity, lead, deal, customer)</param>
    /// <param name="entityId">ID of the entity</param>
    /// <param name="context">Notification context with event details</param>
    /// <param name="entityData">Optional entity data for message customization</param>
    Task NotifyEntityChangeAsync(
        string entityType,
        long entityId,
        NotificationContext context,
        object? entityData = null);
}
