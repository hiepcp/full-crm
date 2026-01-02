using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace CRMSys.Infrastructure.BackgroundServices;

/// <summary>
/// Background service for sending daily follow-up reminders at 8:00 AM
/// </summary>
public class DailyFollowUpReminderService : BackgroundService
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DailyFollowUpReminderService> _logger;

    public DailyFollowUpReminderService(
        IServiceProvider serviceProvider,
        ILogger<DailyFollowUpReminderService> logger)
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Daily Follow-up Reminder Service started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                // Calculate delay until next 8:00 AM
                var delay = CalculateDelayUntil8AM();
                
                _logger.LogInformation("Next follow-up reminder check at {NextRun}", 
                    DateTime.Now.Add(delay).ToString("yyyy-MM-dd HH:mm:ss"));

                // Wait until 8:00 AM
                await Task.Delay(delay, stoppingToken);

                // Run the job
                await ProcessDailyFollowUpRemindersAsync();
            }
            catch (OperationCanceledException)
            {
                // Service is stopping
                _logger.LogInformation("Daily Follow-up Reminder Service is stopping");
                break;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in Daily Follow-up Reminder Service");
                
                // Wait 5 minutes before retrying on error
                await Task.Delay(TimeSpan.FromMinutes(5), stoppingToken);
            }
        }
    }

    private TimeSpan CalculateDelayUntil8AM()
    {
        // TEST MODE: Run in 1 minute
        //return TimeSpan.FromMinutes(1);

        // PRODUCTION MODE: (commented out for testing)
        var now = DateTime.Now;
        var next8AM = DateTime.Today.AddHours(8);

        // If it's already past 8 AM today, schedule for tomorrow
        if (now.Hour >= 8)
        {
            next8AM = next8AM.AddDays(1);
        }

        return next8AM - now;
    }

    private async Task ProcessDailyFollowUpRemindersAsync()
    {
        _logger.LogInformation("Starting daily follow-up reminders processing at {Time}", 
            DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"));

        var stopwatch = System.Diagnostics.Stopwatch.StartNew();

        try
        {
            var today = DateTime.Today;

            using var scope = _serviceProvider.CreateScope();
            var leadRepository = scope.ServiceProvider.GetRequiredService<ILeadRepository>();
            var assigneeRepository = scope.ServiceProvider.GetRequiredService<IAssigneeRepository>();

            // Process leads
            var leadCount = await ProcessLeadFollowUpsAsync(today, leadRepository, assigneeRepository);
            _logger.LogInformation("Processed {Count} lead follow-ups", leadCount);

            // TODO: Add Deal follow-ups when Deal entity has FollowUpDate field
            // var dealRepository = scope.ServiceProvider.GetRequiredService<IDealRepository>();
            // var dealCount = await ProcessDealFollowUpsAsync(today, dealRepository, assigneeRepository);
            // _logger.LogInformation("Processed {Count} deal follow-ups", dealCount);

            stopwatch.Stop();
            _logger.LogInformation(
                "Completed daily follow-up reminders in {ElapsedMs}ms. Total: {Total} notifications",
                stopwatch.ElapsedMilliseconds, leadCount);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to process daily follow-up reminders");
        }
    }

    private async Task<int> ProcessLeadFollowUpsAsync(
        DateTime today, 
        ILeadRepository leadRepository, 
        IAssigneeRepository assigneeRepository)
    {
        // Get leads with follow-up due today
        var leads = await leadRepository.GetLeadsWithFollowUpDueAsync(today);
        var count = 0;

        foreach (var lead in leads)
        {
            // Get all assignees for this lead
            var assignees = await assigneeRepository.GetByRelationAsync("lead", lead.Id);
            
            var leadName = !string.IsNullOrEmpty(lead.Company) 
                ? lead.Company 
                : $"{lead.FirstName} {lead.LastName}".Trim();

            foreach (var assignment in assignees)
            {
                await SendFollowUpNotificationAsync(
                    userEmail: assignment.UserEmail,
                    entityType: "lead",
                    entityId: lead.Id,
                    entityName: leadName,
                    role: assignment.Role ?? "owner",
                    followUpDate: lead.FollowUpDate
                );
                count++;
            }
        }

        return count;
    }

    // TODO: Uncomment and update when Deal entity has FollowUpDate field
    /*
    private async Task<int> ProcessDealFollowUpsAsync(
        DateTime today, 
        IDealRepository dealRepository, 
        IAssigneeRepository assigneeRepository)
    {
        // Get deals with follow-up due today
        var deals = await dealRepository.GetDealsWithFollowUpDueAsync(today);
        var count = 0;

        foreach (var deal in deals)
        {
            // Get all assignees for this deal
            var assignees = await assigneeRepository.GetByRelationAsync("deal", deal.Id);

            foreach (var assignment in assignees)
            {
                await SendFollowUpNotificationAsync(
                    userId: assignment.UserId,
                    entityType: "deal",
                    entityId: deal.Id,
                    entityName: deal.Name ?? $"Deal #{deal.Id}",
                    role: assignment.Role ?? "owner",
                    followUpDate: deal.FollowUpDate
                );
                count++;
            }
        }

        return count;
    }
    */

    private async Task SendFollowUpNotificationAsync(
        string userEmail,
        string entityType,
        long entityId,
        string entityName,
        string role,
        DateTime? followUpDate)
    {
        try
        {
            using var scope = _serviceProvider.CreateScope();
            var notificationService = scope.ServiceProvider.GetRequiredService<INotificationService>();

            var notification = new NotificationDto
            {
                UserEmail = userEmail,
                Type = $"{entityType.ToUpper()}_FOLLOW_UP_DUE",
                Title = $"{char.ToUpper(entityType[0])}{entityType.Substring(1)} follow-up due today",
                Message = $"Follow-up is scheduled today for {entityType} '{entityName}'",
                EntityType = entityType,
                EntityId = entityId,
                Metadata = JsonSerializer.Serialize(new
                {
                    entityId,
                    entityName,
                    entityType,
                    followUpDate,
                    role,
                    sentAt = DateTime.UtcNow,
                    reminderType = "SAME_DAY"
                }),
                CreatedBy = "system@crm.com"
            };

            await notificationService.CreateAndSendAsync(notification);

            _logger.LogDebug(
                "Sent follow-up notification for {EntityType} {EntityId} to User {UserEmail}",
                entityType, entityId, userEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Failed to send follow-up notification for {EntityType} {EntityId} to User {UserEmail}",
                entityType, entityId, userEmail);
        }
    }
}
