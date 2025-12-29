using CRMSys.Application.Dtos.Notification;
using CRMSys.Application.Interfaces.Repositories;
using Dapper;
using Shared.Dapper.Interfaces;

namespace CRMSys.Infrastructure.Repositories;

/// <summary>
/// Repository implementation for fetching notification recipients
/// Uses optimized SQL queries with JOINs to get all related assignees in single query
/// </summary>
public class NotificationRecipientRepository : INotificationRecipientRepository
{
    private readonly IUnitOfWork _unitOfWork;

    public NotificationRecipientRepository(IUnitOfWork unitOfWork)
    {
        _unitOfWork = unitOfWork;
    }

    public async Task<List<AssigneeDto>> GetAssigneesForActivityAsync(long activityId)
    {
        var sql = @"
            -- 1. Activity assignees
            SELECT 
                u.Id as UserId, 
                u.Email,
                'activity' as EntityType,
                a.Role,
                NULL as LeadConversionStatus,
                NULL as DealStatus,
                act.RelationId as ParentEntityId,
                act.RelationType as ParentEntityType
            FROM crm_assignee a
            INNER JOIN crm_activity act ON act.Id = a.RelationId
            INNER JOIN crm_user u ON a.UserEmail = u.Email
            WHERE a.RelationType = 'activity' 
              AND a.RelationId = @activityId
              AND u.IsActive = 1
            
            UNION ALL
            
            -- 2. Parent entity assignees (lead/deal)
            SELECT 
                u.Id as UserId,
                u.Email,
                act.RelationType as EntityType,
                a.Role,
                CASE 
                    WHEN act.RelationType = 'lead' THEN l.Status
                    ELSE NULL 
                END as LeadConversionStatus,
                CASE 
                    WHEN act.RelationType = 'deal' THEN d.Stage
                    ELSE NULL 
                END as DealStatus,
                NULL as ParentEntityId,
                NULL as ParentEntityType
            FROM crm_activity act
            INNER JOIN crm_assignee a 
                ON a.RelationType = act.RelationType 
                AND a.RelationId = act.RelationId
            INNER JOIN crm_user u ON a.UserEmail = u.Email
            LEFT JOIN crm_lead l ON act.RelationType = 'lead' AND l.Id = act.RelationId
            LEFT JOIN crm_deal d ON act.RelationType = 'deal' AND d.Id = act.RelationId
            WHERE act.Id = @activityId
              AND u.IsActive = 1
            
            UNION ALL
            
            -- 3. Customer assignees (if parent is deal)
            SELECT 
                u.Id as UserId,
                u.Email,
                'customer' as EntityType,
                a.Role,
                NULL as LeadConversionStatus,
                NULL as DealStatus,
                d.Id as ParentEntityId,
                'deal' as ParentEntityType
            FROM crm_activity act
            INNER JOIN crm_deal d 
                ON act.RelationType = 'deal' 
                AND act.RelationId = d.Id
            INNER JOIN crm_assignee a 
                ON a.RelationType = 'customer' 
                AND a.RelationId = d.CustomerId
            INNER JOIN crm_user u ON a.UserEmail = u.Email
            WHERE act.Id = @activityId
              AND d.CustomerId IS NOT NULL
              AND u.IsActive = 1";

        var result = await _unitOfWork.Connection.QueryAsync<AssigneeDto>(sql, new { activityId });
        return result.ToList();
    }

    public async Task<List<AssigneeDto>> GetAssigneesForLeadAsync(long leadId)
    {
        var sql = @"
            SELECT 
                u.Id as UserId,
                u.Email,
                'lead' as EntityType,
                a.Role,
                l.Status as LeadConversionStatus,
                NULL as DealStatus,
                NULL as ParentEntityId,
                NULL as ParentEntityType
            FROM crm_assignee a
            INNER JOIN crm_lead l ON l.Id = a.RelationId
            INNER JOIN crm_user u ON a.UserEmail = u.Email
            WHERE a.RelationType = 'lead'
              AND a.RelationId = @leadId
              AND u.IsActive = 1";

        var result = await _unitOfWork.Connection.QueryAsync<AssigneeDto>(sql, new { leadId });
        return result.ToList();
    }

    public async Task<List<AssigneeDto>> GetAssigneesForDealAsync(long dealId)
    {
        var sql = @"
            -- 1. Deal assignees
            SELECT 
                u.Id as UserId,
                u.Email,
                'deal' as EntityType,
                a.Role,
                NULL as LeadConversionStatus,
                d.Stage as DealStatus,
                NULL as ParentEntityId,
                NULL as ParentEntityType
            FROM crm_assignee a
            INNER JOIN crm_deal d ON d.Id = a.RelationId
            INNER JOIN crm_user u ON a.UserEmail = u.Email
            WHERE a.RelationType = 'deal'
              AND a.RelationId = @dealId
              AND u.IsActive = 1
            
            UNION ALL
            
            -- 2. Customer assignees
            SELECT 
                u.Id as UserId,
                u.Email,
                'customer' as EntityType,
                a.Role,
                NULL as LeadConversionStatus,
                NULL as DealStatus,
                d.Id as ParentEntityId,
                'deal' as ParentEntityType
            FROM crm_deal d
            INNER JOIN crm_assignee a 
                ON a.RelationType = 'customer' 
                AND a.RelationId = d.CustomerId
            INNER JOIN crm_user u ON a.UserEmail = u.Email
            WHERE d.Id = @dealId
              AND d.CustomerId IS NOT NULL
              AND u.IsActive = 1";

        var result = await _unitOfWork.Connection.QueryAsync<AssigneeDto>(sql, new { dealId });
        return result.ToList();
    }

    public async Task<List<AssigneeDto>> GetAssigneesForCustomerAsync(long customerId)
    {
        var sql = @"
            -- 1. Customer assignees
            SELECT 
                u.Id as UserId,
                u.Email,
                'customer' as EntityType,
                a.Role,
                NULL as LeadConversionStatus,
                NULL as DealStatus,
                NULL as ParentEntityId,
                NULL as ParentEntityType
            FROM crm_assignee a
            INNER JOIN crm_user u ON a.UserEmail = u.Email
            WHERE a.RelationType = 'customer'
              AND a.RelationId = @customerId
              AND u.IsActive = 1
            
            UNION ALL
            
            -- 2. All active deal assignees for this customer
            SELECT 
                u.Id as UserId,
                u.Email,
                'deal' as EntityType,
                a.Role,
                NULL as LeadConversionStatus,
                d.Stage as DealStatus,
                d.CustomerId as ParentEntityId,
                'customer' as ParentEntityType
            FROM crm_deal d
            INNER JOIN crm_assignee a 
                ON a.RelationType = 'deal' 
                AND a.RelationId = d.Id
            INNER JOIN crm_user u ON a.UserEmail = u.Email
            WHERE d.CustomerId = @customerId
              AND d.Stage NOT IN ('Closed Won', 'Closed Lost')
              AND u.IsActive = 1";

        var result = await _unitOfWork.Connection.QueryAsync<AssigneeDto>(sql, new { customerId });
        return result.ToList();
    }
}
