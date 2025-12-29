using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories;

/// <summary>
/// Notification preference repository interface
/// </summary>
public interface INotificationPreferenceRepository
{
    Task<NotificationPreference?> GetByUserIdAsync(long userId);
    Task<NotificationPreference> CreateAsync(NotificationPreference preference);
    Task<bool> UpdateAsync(NotificationPreference preference);
    Task<bool> ExistsAsync(long userId);
}
