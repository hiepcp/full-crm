using CRMSys.Application.Dtos.Notification;
using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Services;

/// <summary>
/// Service for building customized notification messages
/// </summary>
public interface INotificationBuilder
{
    /// <summary>
    /// Build a notification DTO with customized title and message
    /// </summary>
    /// <param name="recipient">The recipient with their roles</param>
    /// <param name="entityType">Type of entity</param>
    /// <param name="entityId">ID of entity</param>
    /// <param name="context">Notification context</param>
    /// <param name="entityData">Entity-specific data for message customization</param>
    /// <returns>Notification DTO ready to be sent</returns>
    NotificationDto BuildNotification(
        NotificationRecipient recipient,
        string entityType,
        long entityId,
        NotificationContext context,
        object? entityData = null);
}
