using CRMSys.Application.Dtos.Notification;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;

namespace CRMSys.Application.Services;

/// <summary>
/// Implementation of notification rules engine
/// Applies business logic to determine who should receive notifications
/// </summary>
public class NotificationRulesEngine : INotificationRulesEngine
{
    private readonly INotificationRecipientRepository _recipientRepo;
    private readonly ILogger<NotificationRulesEngine> _logger;

    public NotificationRulesEngine(
        INotificationRecipientRepository recipientRepo,
        ILogger<NotificationRulesEngine> logger)
    {
        _recipientRepo = recipientRepo;
        _logger = logger;
    }

    public async Task<List<NotificationRecipient>> DetermineRecipientsAsync(
        string entityType,
        long entityId,
        NotificationContext context)
    {
        try
        {
            // 1. Fetch raw assignees from database
            var assignees = await FetchAssignees(entityType, entityId);
            
            _logger.LogDebug(
                "Fetched {Count} assignees for {EntityType} {EntityId}",
                assignees.Count, entityType, entityId);

            // 2. Apply business rules filters
            assignees = ApplyBusinessRules(assignees, context);
            
            _logger.LogDebug(
                "After business rules: {Count} assignees remaining",
                assignees.Count);

            // 3. Deduplicate and aggregate roles
            var recipients = DeduplicateAndAggregate(assignees);
            
            _logger.LogDebug(
                "After deduplication: {Count} unique recipients",
                recipients.Count);

            // 4. Determine priorities
            DeterminePriorities(recipients);

            return recipients;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, 
                "Error determining recipients for {EntityType} {EntityId}", 
                entityType, entityId);
            return new List<NotificationRecipient>();
        }
    }

    private async Task<List<AssigneeDto>> FetchAssignees(
        string entityType, 
        long entityId)
    {
        return entityType.ToLower() switch
        {
            "activity" => await _recipientRepo.GetAssigneesForActivityAsync(entityId),
            "lead" => await _recipientRepo.GetAssigneesForLeadAsync(entityId),
            "deal" => await _recipientRepo.GetAssigneesForDealAsync(entityId),
            "customer" => await _recipientRepo.GetAssigneesForCustomerAsync(entityId),
            _ => new List<AssigneeDto>()
        };
    }

    private List<AssigneeDto> ApplyBusinessRules(
        List<AssigneeDto> assignees, 
        NotificationContext context)
    {
        // Rule 1: Don't notify converted or closed leads
        assignees = assignees
            .Where(a => a.EntityType != "lead" 
                     || string.IsNullOrEmpty(a.LeadConversionStatus) 
                     || a.LeadConversionStatus == "working")
            .ToList();

        // Rule 2: Don't notify customer for internal notes
        if (context.ActivityType == "internal_note")
        {
            assignees = assignees
                .Where(a => a.EntityType != "customer")
                .ToList();
            
            _logger.LogDebug("Filtered out customer assignees for internal_note");
        }

        // Rule 3: Only notify for active deals (not closed)
        assignees = assignees
            .Where(a => a.EntityType != "deal" 
                     || string.IsNullOrEmpty(a.DealStatus) 
                     || (a.DealStatus != "Closed Won" && a.DealStatus != "Closed Lost"))
            .ToList();

        // Rule 4: Custom filters from metadata
        if (context.Metadata.TryGetValue("excludeCustomers", out var excludeCustomers) 
            && excludeCustomers is bool exclude && exclude)
        {
            assignees = assignees
                .Where(a => a.EntityType != "customer")
                .ToList();
        }

        // Easy to add more rules here:
        // - Time-based filters (Do Not Disturb)
        // - User preferences (when preference table is added back)
        // - Deal value thresholds
        // - etc.

        return assignees;
    }

    private List<NotificationRecipient> DeduplicateAndAggregate(
        List<AssigneeDto> assignees)
    {
        // Use Email as key for deduplication (Email is UNIQUE in crm_user table)
        var recipientDict = new Dictionary<string, NotificationRecipient>();

        foreach (var assignee in assignees)
        {
            if (!recipientDict.ContainsKey(assignee.Email))
            {
                recipientDict[assignee.Email] = new NotificationRecipient
                {
                    UserId = assignee.UserId,
                    Email = assignee.Email,
                    Roles = new HashSet<string>(),
                    Context = new Dictionary<string, object>()
                };
            }

            var recipient = recipientDict[assignee.Email];
            
            // Add role: "activity_owner", "deal_collaborator", etc.
            recipient.Roles.Add($"{assignee.EntityType}_{assignee.Role}");

            // Store parent entity info for context
            if (assignee.ParentEntityId.HasValue && !string.IsNullOrEmpty(assignee.ParentEntityType))
            {
                recipient.Context[$"parent_{assignee.ParentEntityType}"] = assignee.ParentEntityId.Value;
            }
        }

        return recipientDict.Values.ToList();
    }

    private void DeterminePriorities(List<NotificationRecipient> recipients)
    {
        // Define priority order (lower number = higher priority)
        var priorityOrder = new Dictionary<string, int>
        {
            ["activity_owner"] = 1,
            ["activity_collaborator"] = 2,
            ["deal_owner"] = 3,
            ["lead_owner"] = 4,
            ["deal_collaborator"] = 5,
            ["lead_collaborator"] = 6,
            ["customer_owner"] = 7,
            ["customer_collaborator"] = 8
        };

        foreach (var recipient in recipients)
        {
            // Find highest priority role
            recipient.PrimaryRole = recipient.Roles
                .OrderBy(r => priorityOrder.GetValueOrDefault(r, 999))
                .FirstOrDefault() ?? "unknown";
        }
    }
}
