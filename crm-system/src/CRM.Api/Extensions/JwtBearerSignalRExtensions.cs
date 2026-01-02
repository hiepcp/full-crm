using Microsoft.AspNetCore.Authentication.JwtBearer;

namespace CRM.Api.Extensions
{
    /// <summary>
    /// Provides extension methods for configuring JWT Bearer authentication to support SignalR connections using access
    /// tokens from query strings.
    /// </summary>
    /// <remarks>These extensions enable SignalR clients to authenticate using JWT access tokens passed via
    /// the 'access_token' query string parameter, which is required for WebSocket and other non-header-based
    /// transports. This is commonly used when securing SignalR hubs with JWT Bearer authentication in ASP.NET Core
    /// applications.</remarks>
    public static class JwtBearerSignalRExtensions
    {
        /// <summary>
        /// Configures JWT Bearer authentication to support SignalR connections using access tokens provided in the
        /// query string.
        /// </summary>
        /// <remarks>This method enables SignalR clients to authenticate by passing a JWT access token in
        /// the 'access_token' query string parameter when connecting to hubs under the '/hubs' path. This is required
        /// for WebSocket and other transports that do not support setting HTTP headers. Use this method in addition to
        /// standard JWT Bearer authentication configuration when supporting SignalR clients.</remarks>
        /// <param name="services">The service collection to which the authentication services are added.</param>
        /// <returns>The same service collection instance, enabling method chaining.</returns>
        public static IServiceCollection AddJwtBearerSignalR(
            this IServiceCollection services)
        {
            services.Configure<JwtBearerOptions>(
                JwtBearerDefaults.AuthenticationScheme,
                options =>
                {
                    options.Events = new JwtBearerEvents
                    {
                        OnMessageReceived = context =>
                        {
                            var accessToken = context.Request.Query["access_token"];
                            var path = context.HttpContext.Request.Path;

                            // Chỉ cho phép query string token với SignalR hub
                            if (!string.IsNullOrEmpty(accessToken) &&
                                path.StartsWithSegments("/hubs"))
                            {
                                context.Token = accessToken;
                            }

                            return Task.CompletedTask;
                        }
                    };
                });

            return services;
        }
    }
}
