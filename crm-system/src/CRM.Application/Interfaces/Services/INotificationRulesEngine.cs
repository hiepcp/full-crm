using CRMSys.Application.Dtos.Notification;

namespace CRMSys.Application.Interfaces.Services;

/// <summary>
/// Service for applying business rules to determine notification recipients
/// Handles deduplication, filtering, and role prioritization
/// </summary>
public interface INotificationRulesEngine
{
    /// <summary>
    /// Determine final notification recipients based on entity, event, and business rules
    /// </summary>
    /// <param name="entityType">Type of entity (activity, lead, deal, customer)</param>
    /// <param name="entityId">ID of the entity</param>
    /// <param name="context">Notification context with event details</param>
    /// <returns>List of deduplicated recipients with aggregated roles</returns>
    Task<List<NotificationRecipient>> DetermineRecipientsAsync(
        string entityType,
        long entityId,
        NotificationContext context);
}
