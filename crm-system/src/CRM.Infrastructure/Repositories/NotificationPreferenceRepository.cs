using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories;

/// <summary>
/// Notification preference repository implementation using Dapper
/// </summary>
public class NotificationPreferenceRepository : DapperRepository<NotificationPreference, long>, INotificationPreferenceRepository
{
    public NotificationPreferenceRepository(IUnitOfWork unitOfWork)
        : base(unitOfWork)
    {
    }

    public async Task<NotificationPreference?> GetByUserIdAsync(long userId)
    {
        const string sql = "SELECT * FROM crm_notification_preferences WHERE UserId = @UserId";

        return await Connection.QueryFirstOrDefaultAsync<NotificationPreference>(sql, new { UserId = userId }, Transaction);
    }

    public async Task<NotificationPreference> CreateAsync(NotificationPreference preference)
    {
        const string sql = @"
            INSERT INTO crm_notification_preferences 
            (UserId, InAppEnabled, EmailEnabled, LeadNotifications, DealNotifications, 
             CustomerNotifications, ActivityNotifications, MentionNotifications,
             NotifyRelatedDealChanges, NotifyRelatedCustomerChanges,
             MinimumSeverity, DoNotDisturbStart, DoNotDisturbEnd, CreatedAt)
            VALUES 
            (@UserId, @InAppEnabled, @EmailEnabled, @LeadNotifications, @DealNotifications,
             @CustomerNotifications, @ActivityNotifications, @MentionNotifications,
             @NotifyRelatedDealChanges, @NotifyRelatedCustomerChanges,
             @MinimumSeverity, @DoNotDisturbStart, @DoNotDisturbEnd, @CreatedAt);
            SELECT LAST_INSERT_ID();";

        var id = await Connection.ExecuteScalarAsync<long>(sql, preference, Transaction);
        preference.Id = id;
        return preference;
    }

    public async Task<bool> UpdateAsync(NotificationPreference preference)
    {
        const string sql = @"
            UPDATE crm_notification_preferences SET
                InAppEnabled = @InAppEnabled,
                EmailEnabled = @EmailEnabled,
                LeadNotifications = @LeadNotifications,
                DealNotifications = @DealNotifications,
                CustomerNotifications = @CustomerNotifications,
                ActivityNotifications = @ActivityNotifications,
                MentionNotifications = @MentionNotifications,
                NotifyRelatedDealChanges = @NotifyRelatedDealChanges,
                NotifyRelatedCustomerChanges = @NotifyRelatedCustomerChanges,
                MinimumSeverity = @MinimumSeverity,
                DoNotDisturbStart = @DoNotDisturbStart,
                DoNotDisturbEnd = @DoNotDisturbEnd,
                UpdatedAt = @UpdatedAt
            WHERE UserId = @UserId";

        var affected = await Connection.ExecuteAsync(sql, preference, Transaction);
        return affected > 0;
    }

    public async Task<bool> ExistsAsync(long userId)
    {
        const string sql = "SELECT COUNT(*) FROM crm_notification_preferences WHERE UserId = @UserId";

        var count = await Connection.ExecuteScalarAsync<int>(sql, new { UserId = userId }, Transaction);
        return count > 0;
    }
}
