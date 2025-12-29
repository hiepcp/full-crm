using Microsoft.AspNetCore.Connections;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ResAuthApi.Application.Interfaces;
using ResAuthApi.Infrastructure.DatabaseInit;
using ResAuthApi.Infrastructure.Persistence;

namespace ResAuthApi.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";

        services.AddSingleton(new MySqlConnectionFactory(connectionString!));
        services.AddScoped<IRefreshTokenRepository, DapperRefreshTokenRepository>();
        services.AddScoped<IResponseConfigSystemRepository, ResponseConfigSystemRepository>();
        services.AddScoped<IUserRepository, UserRepository>();

        // Đăng ký DatabaseInitializer
        services.AddTransient<DatabaseInitializer>(); 

        return services;
    }
}
