namespace CRM.Api.Configuration;

/// <summary>
/// Configuration options for Excel preview caching
/// FR-017: 15-minute cache expiration
/// </summary>
public class ExcelPreviewCacheOptions
{
    /// <summary>
    /// Maximum cache size in bytes (default: 100 MB)
    /// Prevents unbounded memory growth
    /// </summary>
    public long MaxCacheSizeBytes { get; set; } = 100 * 1024 * 1024;

    /// <summary>
    /// Sliding expiration window (default: 15 minutes per FR-017)
    /// Cache entry expires if not accessed within this timespan
    /// </summary>
    public TimeSpan SlidingExpiration { get; set; } = TimeSpan.FromMinutes(15);

    /// <summary>
    /// Compaction percentage when cache is full (default: 0.25)
    /// When memory limit is reached, evict 25% of least recently used entries
    /// </summary>
    public double CompactionPercentage { get; set; } = 0.25;

    /// <summary>
    /// Enable cache statistics logging (default: true)
    /// Logs cache hits, misses, and performance metrics (NFR-001, NFR-003)
    /// </summary>
    public bool EnableStatistics { get; set; } = true;

    /// <summary>
    /// Enable per-user cache isolation (default: true)
    /// Ensures different users have separate cache entries for the same file (NFR-012)
    /// </summary>
    public bool EnableUserIsolation { get; set; } = true;
}
