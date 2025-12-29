using CRMSys.Application.Dtos.Notification;

namespace CRMSys.Application.Interfaces.Repositories;

/// <summary>
/// Repository for fetching notification recipients with their roles and context
/// </summary>
public interface INotificationRecipientRepository
{
    /// <summary>
    /// Get all assignees for an activity (includes activity, parent entity, and customer assignees)
    /// </summary>
    Task<List<AssigneeDto>> GetAssigneesForActivityAsync(long activityId);
    
    /// <summary>
    /// Get all assignees for a lead
    /// </summary>
    Task<List<AssigneeDto>> GetAssigneesForLeadAsync(long leadId);
    
    /// <summary>
    /// Get all assignees for a deal (includes deal and customer assignees)
    /// </summary>
    Task<List<AssigneeDto>> GetAssigneesForDealAsync(long dealId);
    
    /// <summary>
    /// Get all assignees for a customer (includes customer and active deal assignees)
    /// </summary>
    Task<List<AssigneeDto>> GetAssigneesForCustomerAsync(long customerId);
}
