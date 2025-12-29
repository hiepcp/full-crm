using Microsoft.Extensions.DependencyInjection;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Application.Services;

namespace ResAuthZApi.Application
{
    public static class DependencyInjection
    {
        public static IServiceCollection AddApplicationAuthZ(this IServiceCollection services)
        {
            services.AddScoped(typeof(IBaseService<,>), typeof(BaseService<,>));

            services.AddScoped<IResourceService, ResourceService>();
            services.AddScoped<IRoleService, RoleService>();
            services.AddScoped<IActionService, ActionService>();
            services.AddScoped<IApplicationService, ApplicationService>();
            services.AddScoped<IMenuService, MenuService>();
            services.AddScoped<IPermissionService, PermissionService>();
            services.AddScoped<IUserService, UserService>();

            services.AddScoped<IAuthorizationService, AuthorizationService>();

            return services;
        }
    }
}
