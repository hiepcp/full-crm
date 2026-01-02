using CRMSys.Application.Dtos.Notification;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using System.Text.Json;

namespace CRMSys.Application.Services;

/// <summary>
/// Implementation of notification builder
/// Generates customized notification messages based on recipient roles
/// </summary>
public class NotificationBuilder : INotificationBuilder
{
    public NotificationDto BuildNotification(
        NotificationRecipient recipient,
        string entityType,
        long entityId,
        NotificationContext context,
        object? entityData = null)
    {
        var (title, message) = GenerateMessage(
            recipient, entityType, context, entityData);

        return new NotificationDto
        {
            UserEmail = recipient.Email,
            Type = $"{entityType.ToUpper()}_{context.EventType}",
            Title = title,
            Message = message,
            EntityType = entityType,
            EntityId = entityId,
            Metadata = JsonSerializer.Serialize(new
            {
                userRoles = recipient.Roles,
                primaryRole = recipient.PrimaryRole,
                eventType = context.EventType,
                activityType = context.ActivityType,
                recipientContext = recipient.Context
            }),
            CreatedBy = context.Metadata.GetValueOrDefault("triggeredBy", "system")?.ToString() ?? "system"
        };
    }

    private (string title, string message) GenerateMessage(
        NotificationRecipient recipient,
        string entityType,
        NotificationContext context,
        object? entityData)
    {
        // Single role - simple message
        if (recipient.Roles.Count == 1)
        {
            return GenerateSingleRoleMessage(
                recipient.PrimaryRole, entityType, context, entityData);
        }

        // Multiple roles - rich message showing user has multiple roles
        return GenerateMultiRoleMessage(
            recipient, entityType, context, entityData);
    }

    private (string, string) GenerateSingleRoleMessage(
        string role,
        string entityType,
        NotificationContext context,
        object? entityData)
    {
        var action = GetActionText(context.EventType);
        var entityName = GetEntityName(entityType, entityData);

        return (role, entityType) switch
        {
            // Activity notifications
            ("activity_owner", "activity") => (
                $"Your activity {action}",
                $"Activity '{entityName}' has been {action}"
            ),
            ("activity_collaborator", "activity") => (
                $"Activity {action}",
                $"Activity '{entityName}' you collaborate on has been {action}"
            ),

            // Activity notifications for deal team
            ("deal_owner", "activity") => (
                $"Activity in your deal {action}",
                $"Activity '{entityName}' in your deal has been {action}"
            ),
            ("deal_collaborator", "activity") => (
                $"Deal activity {action}",
                $"Activity '{entityName}' in a deal you collaborate on has been {action}"
            ),

            // Activity notifications for lead team
            ("lead_owner", "activity") => (
                $"Activity in your lead {action}",
                $"Activity '{entityName}' in your lead has been {action}"
            ),
            ("lead_collaborator", "activity") => (
                $"Lead activity {action}",
                $"Activity '{entityName}' in a lead you collaborate on has been {action}"
            ),

            // Activity notifications for customer team
            ("customer_owner", "activity") => (
                $"Activity for your customer {action}",
                $"Activity '{entityName}' for your customer has been {action}"
            ),
            ("customer_collaborator", "activity") => (
                $"Customer activity {action}",
                $"Activity '{entityName}' for a customer you manage has been {action}"
            ),

            // Lead notifications
            ("lead_owner", "lead") => (
                $"Your lead {action}",
                $"Lead '{entityName}' has been {action}"
            ),
            ("lead_collaborator", "lead") => (
                $"Lead {action}",
                $"Lead '{entityName}' you collaborate on has been {action}"
            ),

            // Deal notifications
            ("deal_owner", "deal") => (
                $"Your deal {action}",
                $"Deal '{entityName}' has been {action}"
            ),
            ("deal_collaborator", "deal") => (
                $"Deal {action}",
                $"Deal '{entityName}' you collaborate on has been {action}"
            ),
            ("customer_owner", "deal") => (
                $"Deal for your customer {action}",
                $"Deal '{entityName}' for your customer has been {action}"
            ),
            ("customer_collaborator", "deal") => (
                $"Customer deal {action}",
                $"Deal '{entityName}' for a customer you manage has been {action}"
            ),

            // Customer notifications
            ("customer_owner", "customer") => (
                $"Your customer {action}",
                $"Customer '{entityName}' has been {action}"
            ),
            ("customer_collaborator", "customer") => (
                $"Customer {action}",
                $"Customer '{entityName}' you collaborate on has been {action}"
            ),
            ("deal_owner", "customer") => (
                $"Customer information {action}",
                $"Customer '{entityName}' for your deal has been {action}"
            ),
            ("deal_collaborator", "customer") => (
                $"Customer information {action}",
                $"Customer '{entityName}' related to your deal has been {action}"
            ),

            // Default fallback
            _ => (
                $"{entityType} {action}",
                $"{entityType} '{entityName}' has been {action}"
            )
        };
    }

    private (string, string) GenerateMultiRoleMessage(
        NotificationRecipient recipient,
        string entityType,
        NotificationContext context,
        object? entityData)
    {
        var action = GetActionText(context.EventType);
        var entityName = GetEntityName(entityType, entityData);
        
        // Show up to 2 roles in message
        var roleDisplay = string.Join(" and ", 
            recipient.Roles
                .Select(r => r.Replace("_", " "))
                .Take(2));

        var moreRoles = recipient.Roles.Count > 2 
            ? $" (+{recipient.Roles.Count - 2} more)" 
            : "";

        return (
            $"{char.ToUpper(entityType[0])}{entityType.Substring(1)} {action}",
            $"{char.ToUpper(entityType[0])}{entityType.Substring(1)} '{entityName}' {action} (you are {roleDisplay}{moreRoles})"
        );
    }

    private string GetActionText(string eventType) => eventType switch
    {
        "CREATED" => "created",
        "UPDATED" => "updated",
        "DELETED" => "deleted",
        "COMPLETED" => "completed",
        "ASSIGNED" => "assigned to you",
        "STATUS_CHANGED" => "status changed",
        "STAGE_CHANGED" => "stage changed",
        "CONVERTED" => "converted",
        "WON" => "won",
        "LOST" => "lost",
        _ => "changed"
    };

    private string GetEntityName(string entityType, object? entityData)
    {
        if (entityData == null)
            return $"#{entityType}";

        // Try to extract name from entity data
        // Using dynamic to handle different entity types
        try
        {
            var json = JsonSerializer.Serialize(entityData);
            var dict = JsonSerializer.Deserialize<Dictionary<string, JsonElement>>(json);

            if (dict == null) return $"#{entityType}";

            // Try common name fields
            var nameFields = new[] { "Subject", "Name", "Title", "Company", "FullName" };
            
            foreach (var field in nameFields)
            {
                if (dict.TryGetValue(field, out var value) && 
                    value.ValueKind == JsonValueKind.String)
                {
                    var name = value.GetString();
                    if (!string.IsNullOrWhiteSpace(name))
                        return name;
                }
            }

            // Fallback for lead: FirstName + LastName
            if (entityType == "lead" && 
                dict.TryGetValue("FirstName", out var firstName) &&
                dict.TryGetValue("LastName", out var lastName))
            {
                var fullName = $"{firstName.GetString()} {lastName.GetString()}".Trim();
                if (!string.IsNullOrWhiteSpace(fullName))
                    return fullName;
            }
        }
        catch
        {
            // If parsing fails, return default
        }

        return $"#{entityType}";
    }
}
