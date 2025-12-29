using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using CRM.Api.Configuration;

namespace CRM.Api.Middleware;

/// <summary>
/// Middleware for caching Excel file preview content
/// T059-T070: Server-side caching implementation
/// FR-017: 15-minute sliding expiration
/// NFR-007: Performance improvement for repeated access
/// NFR-012: Permission-aware caching with user isolation
/// </summary>
public class ExcelPreviewCacheMiddleware
{
    private readonly RequestDelegate _next;
    private readonly IMemoryCache _cache;
    private readonly ILogger<ExcelPreviewCacheMiddleware> _logger;
    private readonly ExcelPreviewCacheOptions _options;

    public ExcelPreviewCacheMiddleware(
        RequestDelegate next,
        IMemoryCache cache,
        ILogger<ExcelPreviewCacheMiddleware> logger,
        IOptions<ExcelPreviewCacheOptions> options)
    {
        _next = next;
        _cache = cache;
        _logger = logger;
        _options = options.Value;
    }

    /// <summary>
    /// T061: Intercept /api/files/{idRef}/content requests and implement caching
    /// </summary>
    public async Task InvokeAsync(HttpContext context)
    {
        // Only cache GET requests to /content endpoint for Excel files
        if (!ShouldCacheRequest(context))
        {
            await _next(context);
            return;
        }

        // T062: Generate cache key with format "excel_preview_{idRef}_{userId}"
        var cacheKey = GenerateCacheKey(context);
        if (string.IsNullOrEmpty(cacheKey))
        {
            await _next(context);
            return;
        }

        // T063: Try to get cached content
        if (_cache.TryGetValue(cacheKey, out byte[]? cachedContent) && cachedContent != null)
        {
            // Cache HIT
            await ServeCachedContent(context, cachedContent, cacheKey);
            return;
        }

        // T064: Cache MISS - call next middleware and capture response
        await CaptureAndCacheResponse(context, cacheKey);
    }

    /// <summary>
    /// Determine if request should be cached
    /// Only cache Excel file content requests
    /// </summary>
    private bool ShouldCacheRequest(HttpContext context)
    {
        // Only cache GET requests
        if (!HttpMethods.IsGet(context.Request.Method))
        {
            return false;
        }

        // Check if path matches /api/files/{idRef}/content pattern
        var path = context.Request.Path.Value;
        if (string.IsNullOrEmpty(path))
        {
            return false;
        }

        return path.Contains("/api/files/") && path.EndsWith("/content");
    }

    /// <summary>
    /// T062: Generate cache key with user isolation
    /// Format: "excel_preview_{idRef}_{userId}"
    /// </summary>
    private string? GenerateCacheKey(HttpContext context)
    {
        try
        {
            // Extract idRef from route
            var idRef = context.Request.RouteValues["idRef"]?.ToString();
            if (string.IsNullOrEmpty(idRef))
            {
                return null;
            }

            // Extract userId from JWT claims (NFR-012: user isolation)
            var userId = context.User?.FindFirst("sub")?.Value
                        ?? context.User?.FindFirst("userId")?.Value
                        ?? context.User?.Identity?.Name
                        ?? "anonymous";

            // Don't cache for anonymous users
            if (userId == "anonymous" && _options.EnableUserIsolation)
            {
                return null;
            }

            return $"excel_preview_{idRef}_{userId}";
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to generate cache key");
            return null;
        }
    }

    /// <summary>
    /// T063: Serve content from cache (cache HIT)
    /// </summary>
    private async Task ServeCachedContent(HttpContext context, byte[] content, string cacheKey)
    {
        // T069: Log cache HIT (NFR-001)
        if (_options.EnableStatistics)
        {
            _logger.LogInformation(
                "Excel preview cache HIT: Key={CacheKey}, Size={SizeKB}KB, User={UserId}",
                cacheKey,
                content.Length / 1024.0,
                context.User?.Identity?.Name ?? "Unknown"
            );
        }

        // Add cache hit header for monitoring
        context.Response.Headers.Add("X-Cache-Hit", "true");
        context.Response.Headers.Add("X-Response-Time", "0ms"); // Served from cache

        // Set content type for Excel files
        context.Response.ContentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        context.Response.ContentLength = content.Length;

        await context.Response.Body.WriteAsync(content);
    }

    /// <summary>
    /// T064, T065: Capture response and cache it (cache MISS)
    /// </summary>
    private async Task CaptureAndCacheResponse(HttpContext context, string cacheKey)
    {
        var startTime = DateTime.UtcNow;

        // Replace response body stream to capture output
        var originalBodyStream = context.Response.Body;
        using var responseBody = new MemoryStream();
        context.Response.Body = responseBody;

        try
        {
            // Call next middleware (FilesController)
            await _next(context);

            // Only cache successful responses with content
            if (context.Response.StatusCode == 200 && responseBody.Length > 0)
            {
                // T065: Set cache entry with sliding expiration
                var content = responseBody.ToArray();
                var cacheOptions = new MemoryCacheEntryOptions()
                    .SetSize(content.Length) // Track size for SizeLimit
                    .SetSlidingExpiration(_options.SlidingExpiration) // FR-017: 15 minutes
                    .RegisterPostEvictionCallback(OnCacheEviction, this); // T066: Eviction callback

                _cache.Set(cacheKey, content, cacheOptions);

                // T069: Log cache MISS and performance (NFR-001, NFR-003)
                if (_options.EnableStatistics)
                {
                    var responseTime = (DateTime.UtcNow - startTime).TotalMilliseconds;
                    _logger.LogInformation(
                        "Excel preview cache MISS: Key={CacheKey}, Size={SizeKB}KB, ResponseTime={ResponseTimeMs}ms, User={UserId}",
                        cacheKey,
                        content.Length / 1024.0,
                        responseTime,
                        context.User?.Identity?.Name ?? "Unknown"
                    );
                }

                // Add cache miss header
                context.Response.Headers.Add("X-Cache-Hit", "false");
            }

            // Copy captured response back to original stream
            responseBody.Seek(0, SeekOrigin.Begin);
            await responseBody.CopyToAsync(originalBodyStream);
        }
        finally
        {
            context.Response.Body = originalBodyStream;
        }
    }

    /// <summary>
    /// T066: Post-eviction callback for logging
    /// T070: Log cache evictions (NFR-001)
    /// </summary>
    private static void OnCacheEviction(object key, object? value, EvictionReason reason, object? state)
    {
        if (state is ExcelPreviewCacheMiddleware middleware && middleware._options.EnableStatistics)
        {
            var contentSize = (value as byte[])?.Length ?? 0;
            middleware._logger.LogInformation(
                "Cache eviction: Key={CacheKey}, Reason={Reason}, Size={SizeKB}KB",
                key,
                reason,
                contentSize / 1024.0
            );
        }
    }
}

/// <summary>
/// Extension method for registering the middleware
/// </summary>
public static class ExcelPreviewCacheMiddlewareExtensions
{
    public static IApplicationBuilder UseExcelPreviewCache(this IApplicationBuilder builder)
    {
        return builder.UseMiddleware<ExcelPreviewCacheMiddleware>();
    }
}
