using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Application.Services;
using ResAuthZApi.Infrastructure.DatabaseInit;
using ResAuthZApi.Infrastructure.Repositories;
using Shared.Dapper.Infrastructure;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace ResAuthZApi.Infrastructure
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddInfrastructureAuthZ(this IServiceCollection services, IConfiguration configuration)
        {
            var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";

            // Factory tạo MySQL connection
            services.AddSingleton<IDbConnectionFactory>(_ => new DbConnectionFactory(connectionString));

            // Đăng ký DatabaseInitializer
            services.AddTransient<DatabaseInitializer>();

            // UnitOfWork (Scoped per request)
            services.AddScoped<IUnitOfWork, UnitOfWork>();

            // Repository + Service
            services.AddScoped(typeof(IRepository<,>), typeof(DapperRepository<,>));

            // Register repositories            
            services.AddScoped<IUserRepository, UserRepository>();
            services.AddScoped<IRoleRepository, RoleRepository>();

            services.AddScoped<IAuthorizationRepository, AuthorizationRepository>();
            services.AddScoped<IResourceActionRepository, ResourceActionRepository>();
            services.AddScoped<IPermissionRepository, PermissionRepository>();
            services.AddScoped<IMenuRepository, MenuRepository>();

            return services;
        }
    }
}
