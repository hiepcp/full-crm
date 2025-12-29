using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Infrastructure.BackgroundServices;
using CRMSys.Infrastructure.DatabaseInit;
using CRMSys.Infrastructure.Repositories;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Shared.Dapper.Infrastructure;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";

        // Factory t?o MySQL connection
        services.AddSingleton<IDbConnectionFactory>(_ => new DbConnectionFactory(connectionString));

        // �ang k� DatabaseInitializer
        services.AddTransient<DatabaseInitializer>();

        // UnitOfWork (Scoped per request)
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Repository
        services.AddScoped(typeof(IRepository<,>), typeof(DapperRepository<,>));
        services.AddScoped<ICRMCategoryRepository, CRMCategoryRepository>();
        services.AddScoped<ILeadRepository, LeadRepository>();
        services.AddScoped<ILeadAddressRepository, LeadAddressRepository>();

        // Register new CRM repositories
        services.AddScoped<ICustomerRepository, CustomerRepository>();
        services.AddScoped<IContactRepository, ContactRepository>();
        services.AddScoped<IDealRepository, DealRepository>();
        services.AddScoped<ICustomerAddressRepository, CustomerAddressRepository>();
        services.AddScoped<IActivityRepository, ActivityRepository>();
        services.AddScoped<IEmailRepository, EmailRepository>();
        services.AddScoped<IAppointmentRepository, AppointmentRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IQuotationRepository, QuotationRepository>();
        services.AddScoped<IDealQuotationRepository, DealQuotationRepository>();
        services.AddScoped<IAssigneeRepository, AssigneeRepository>();
        services.AddScoped<IPipelineLogRepository, PipelineLogRepository>();
        services.AddScoped<IActivityParticipantRepository, ActivityParticipantRepository>();
        services.AddScoped<IActivityAttachmentRepository, ActivityAttachmentRepository>();
        services.AddScoped<IAddressRepository, AddressRepository>();
        services.AddScoped<IGoalRepository, GoalRepository>();
        services.AddScoped<IGoalProgressHistoryRepository, GoalProgressHistoryRepository>();
        services.AddScoped<IGoalAuditLogRepository, GoalAuditLogRepository>();
        services.AddScoped<IEmailTemplateRepository, EmailTemplateRepository>();
        services.AddScoped<IEmailTemplateVariableRepository, EmailTemplateVariableRepository>();
        services.AddScoped<ILeadScoreRuleRepository, LeadScoreRuleRepository>();
        
        // Notification repositories
        services.AddScoped<INotificationRepository, NotificationRepository>();
        services.AddScoped<INotificationPreferenceRepository, NotificationPreferenceRepository>();

        // Notification push service (SignalR)
        services.AddScoped<CRMSys.Application.Interfaces.Services.INotificationPushService, 
            CRMSys.Infrastructure.Services.SignalRNotificationPushService>();

        // Register background services
        services.AddHostedService<GoalSnapshotJob>();
        services.AddHostedService<GoalProgressCalculationJob>();

        return services;
    }
}
