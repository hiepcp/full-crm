using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace CRMSys.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            // Register Dynamics 365 Category Sync Service
            services.AddScoped<IDynamics365CategorySyncService, Dynamics365CategorySyncService>();

            return services;
        }
    }
}
