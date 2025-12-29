using Microsoft.AspNetCore.Authorization;

namespace ResAuthApi.Api.Middleware
{
    public class ApiKeyMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ApiKeyMiddleware> _logger;
        private readonly string _apiKeyHeaderName;
        private readonly string _configuredApiKey;

        public ApiKeyMiddleware(RequestDelegate next, ILogger<ApiKeyMiddleware> logger, IConfiguration configuration)
        {
            _next = next;
            _logger = logger;

            // Lấy từ appsettings.json
            _apiKeyHeaderName = configuration["ApiKey:Header"] ?? "XApiKey";
            _configuredApiKey = configuration["ApiKey:Value"] ?? string.Empty;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var endpoint = context.GetEndpoint();
            if (endpoint?.Metadata.GetMetadata<AllowAnonymousAttribute>() != null)
            {
                await _next(context);
                return;
            }

            if (!context.Request.Headers.TryGetValue(_apiKeyHeaderName, out var extractedApiKey))
            {
                _logger.LogWarning("Missing API key");
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("API key missing");
                return;
            }

            if (!string.Equals(_configuredApiKey, extractedApiKey, StringComparison.Ordinal))
            {
                _logger.LogWarning("Invalid API key");
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                await context.Response.WriteAsync("Invalid API key");
                return;
            }

            _logger.LogDebug("API key validated");
            await _next(context);
        }
    }

}
