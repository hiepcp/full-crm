using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories;

/// <summary>
/// Notification repository interface
/// </summary>
public interface INotificationRepository
{
    Task<Notification> CreateAsync(Notification notification);
    Task<List<Notification>> GetByUserIdAsync(long userId, int skip, int take);
    Task<int> GetUnreadCountAsync(long userId);
    Task<Notification?> GetByIdAsync(string id);
    Task<bool> MarkAsReadAsync(string id, long userId);
    Task<int> MarkAllAsReadAsync(long userId);
    Task<bool> DeleteAsync(string id, long userId);
}
