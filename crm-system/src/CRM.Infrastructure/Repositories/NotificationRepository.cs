using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories;

/// <summary>
/// Notification repository implementation using Dapper
/// </summary>
public class NotificationRepository : DapperRepository<Notification, string>, INotificationRepository
{
    public NotificationRepository(IUnitOfWork unitOfWork)
        : base(unitOfWork)
    {
    }

    public async Task<Notification> CreateAsync(Notification notification)
    {
        const string sql = @"
            INSERT INTO crm_notifications 
            (Id, UserId, Type, Title, Message, EntityType, EntityId, IsRead, ReadAt,
             Metadata, CreatedAt, CreatedBy)
            VALUES 
            (@Id, @UserId, @Type, @Title, @Message, @EntityType, @EntityId, @IsRead, @ReadAt,
             @Metadata, @CreatedAt, @CreatedBy)";

        await Connection.ExecuteAsync(sql, notification, Transaction);
        return notification;
    }

    public async Task<List<Notification>> GetByUserIdAsync(long userId, int skip, int take)
    {
        const string sql = @"
            SELECT 
                CAST(Id AS CHAR(36)) AS Id,
                UserId, Type, Title, Message, EntityType, EntityId, 
                IsRead, ReadAt, Metadata, 
                CreatedAt, CreatedBy, UpdatedAt
            FROM crm_notifications
            WHERE UserId = @UserId
            ORDER BY CreatedAt DESC
            LIMIT @Take OFFSET @Skip";

        var result = await Connection.QueryAsync<Notification>(sql, new { UserId = userId, Skip = skip, Take = take }, Transaction);
        return result.ToList();
    }

    public async Task<int> GetUnreadCountAsync(long userId)
    {
        const string sql = @"
            SELECT COUNT(*) FROM crm_notifications
            WHERE UserId = @UserId AND IsRead = 0";

        return await Connection.ExecuteScalarAsync<int>(sql, new { UserId = userId }, Transaction);
    }

    public async Task<Notification?> GetByIdAsync(string id)
    {
        const string sql = @"
            SELECT 
                CAST(Id AS CHAR(36)) AS Id,
                UserId, Type, Title, Message, EntityType, EntityId, 
                IsRead, ReadAt, Metadata, 
                CreatedAt, CreatedBy, UpdatedAt
            FROM crm_notifications 
            WHERE Id = @Id";

        return await Connection.QueryFirstOrDefaultAsync<Notification>(sql, new { Id = id }, Transaction);
    }

    public async Task<bool> MarkAsReadAsync(string id, long userId)
    {
        const string sql = @"
            UPDATE crm_notifications
            SET IsRead = 1, ReadAt = @ReadAt, UpdatedAt = @UpdatedAt
            WHERE Id = @Id AND UserId = @UserId";

        var affected = await Connection.ExecuteAsync(sql, new
        {
            Id = id,
            UserId = userId,
            ReadAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }, Transaction);

        return affected > 0;
    }

    public async Task<int> MarkAllAsReadAsync(long userId)
    {
        const string sql = @"
            UPDATE crm_notifications
            SET IsRead = 1, ReadAt = @ReadAt, UpdatedAt = @UpdatedAt
            WHERE UserId = @UserId AND IsRead = 0";

        return await Connection.ExecuteAsync(sql, new
        {
            UserId = userId,
            ReadAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        }, Transaction);
    }

    public async Task<bool> DeleteAsync(string id, long userId)
    {
        const string sql = "DELETE FROM crm_notifications WHERE Id = @Id AND UserId = @UserId";

        var affected = await Connection.ExecuteAsync(sql, new { Id = id, UserId = userId }, Transaction);
        return affected > 0;
    }
}
