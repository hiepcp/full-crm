using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories;

/// <summary>
/// Notification repository interface
/// </summary>
public interface INotificationRepository
{
    Task<Notification> CreateAsync(Notification notification);
    Task<List<Notification>> GetByUserEmailAsync(string userEmail, int skip, int take);
    Task<int> GetUnreadCountAsync(string userEmail);
    Task<Notification?> GetByIdAsync(string id);
    Task<bool> MarkAsReadAsync(string id, string userEmail);
    Task<int> MarkAllAsReadAsync(string userEmail);
    Task<bool> DeleteAsync(string id, string userEmail);
}
