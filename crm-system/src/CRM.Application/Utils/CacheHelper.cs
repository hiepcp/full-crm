using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;
using Serilog;
using System.Collections.Concurrent;

namespace CRMSys.Application.Utils;

/// <summary>
/// Thread-safe cache helper with tracking and management capabilities
/// </summary>
public interface ICacheHelper
{
    T? Get<T>(string key);
    Task<T?> GetAsync<T>(string key);
    void Set<T>(string key, T value, int refType, TimeSpan? expiration = null);
    Task SetAsync<T>(string key, T value, int refType, TimeSpan? expiration = null);
    void SetSimple<T>(string key, T value, TimeSpan? expiration = null);
    Task SetSimpleAsync<T>(string key, T value, TimeSpan? expiration = null);
    T GetOrCreate<T>(string key, int refType, Func<T> factory, TimeSpan? expiration = null);
    Task<T> GetOrCreateAsync<T>(string key, int refType, Func<Task<T>> factory, TimeSpan? expiration = null);
    void Remove(string key);
    void ClearByRefType(int refType);
    void ClearAll();
    void CompactCache(double percentage = 1.0);
    Dictionary<int, List<string>> GetAllCacheKeys();
    List<string> GetAllCacheKeysList();
    List<string> GetCacheKeysByRefType(int refType);
    CacheStatistics GetStatistics();
}

public class CacheHelper : ICacheHelper
{
    private readonly IMemoryCache _cache;
    //private readonly ILogger<CacheHelper> _logger;
    private readonly ConcurrentDictionary<int, ConcurrentBag<string>> _cacheKeysByRefType;
    private readonly TimeSpan _defaultExpiration;
    // ✅ Thêm instance ID để track
    private readonly string _instanceId;

    public CacheHelper(
        IMemoryCache cache,
        ILogger<CacheHelper> logger,
        TimeSpan? defaultExpiration = null)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache));
        //_logger = logger ?? throw new ArgumentNullException(nameof(logger));
        _cacheKeysByRefType = new ConcurrentDictionary<int, ConcurrentBag<string>>();
        _defaultExpiration = defaultExpiration ?? TimeSpan.FromMinutes(30);

        // ✅ Generate unique ID
        _instanceId = Guid.NewGuid().ToString("N")[..8];

        Log.Information("🚀 CacheHelper instance created: {InstanceId}", _instanceId);
    }

    #region Get Operations

    /// <summary>
    /// Get cached value by key
    /// </summary>
    public T? Get<T>(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            Log.Warning("Cannot get cache: key is null or empty");
            return default;
        }

        if (_cache.TryGetValue(key, out T? value))
        {
            Log.Debug("Cache hit for key: {CacheKey}", key);
            return value;
        }

        Log.Debug("Cache miss for key: {CacheKey}", key);
        return default;
    }

    /// <summary>
    /// Get cached value by key (async)
    /// </summary>
    public Task<T?> GetAsync<T>(string key)
    {
        return Task.FromResult(Get<T>(key));
    }

    #endregion

    #region Set Operations

    /// <summary>
    /// Set cache value with tracking
    /// </summary>
    public void Set<T>(string key, T value, int refType, TimeSpan? expiration = null)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            Log.Warning("Cannot set cache: key is null or empty");
            return;
        }

        var cacheExpiration = expiration ?? _defaultExpiration;

        var cacheEntryOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(cacheExpiration)
            .RegisterPostEvictionCallback((evictedKey, evictedValue, reason, state) =>
            {
                Log.Debug("Cache evicted - Key: {Key}, Reason: {Reason}", evictedKey, reason);
                RemoveCacheKeyFromTracking(refType, evictedKey.ToString()!);
            });

        _cache.Set(key, value, cacheEntryOptions);
        TrackCacheKey(refType, key);

        Log.Debug("Cache set for key: {CacheKey}, RefType: {RefType}, Expiration: {Expiration}", key, refType, cacheExpiration);
    }

    /// <summary>
    /// Set cache value with tracking (async)
    /// </summary>
    public Task SetAsync<T>(string key, T value, int refType, TimeSpan? expiration = null)
    {
        Set(key, value, refType, expiration);
        return Task.CompletedTask;
    }

    /// <summary>
    /// Set cache value without tracking (no refType required)
    /// </summary>
    public void SetSimple<T>(string key, T value, TimeSpan? expiration = null)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            Log.Warning("Cannot set cache: key is null or empty");
            return;
        }

        var cacheExpiration = expiration ?? _defaultExpiration;

        var cacheEntryOptions = new MemoryCacheEntryOptions()
            .SetAbsoluteExpiration(cacheExpiration);

        _cache.Set(key, value, cacheEntryOptions);

        Log.Debug("Cache set (simple) for key: {CacheKey}, Expiration: {Expiration}",
            key, cacheExpiration);
    }

    /// <summary>
    /// Set cache value without tracking (async, no refType required)
    /// </summary>
    public Task SetSimpleAsync<T>(string key, T value, TimeSpan? expiration = null)
    {
        SetSimple(key, value, expiration);
        return Task.CompletedTask;
    }
    #endregion

    #region GetOrCreate Operations

    /// <summary>
    /// Get cached value or create if not exists
    /// </summary>
    public T GetOrCreate<T>(string key, int refType, Func<T> factory, TimeSpan? expiration = null)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            Log.Warning("Cannot get or create cache: key is null or empty");
            return factory();
        }

        if (_cache.TryGetValue(key, out T? cachedValue))
        {
            Log.Debug("Cache hit for key: {CacheKey}", key);
            return cachedValue!;
        }

        var value = factory();
        Set(key, value, refType, expiration);

        return value;
    }

    /// <summary>
    /// Get cached value or create if not exists (async)
    /// </summary>
    public async Task<T> GetOrCreateAsync<T>(string key, int refType, Func<Task<T>> factory, TimeSpan? expiration = null)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            Log.Warning("Cannot get or create cache: key is null or empty");
            return await factory();
        }

        if (_cache.TryGetValue(key, out T? cachedValue))
        {
            Log.Debug("Cache hit for key: {CacheKey}", key);
            return cachedValue!;
        }

        var value = await factory();
        await SetAsync(key, value, refType, expiration);

        return value;
    }

    #endregion

    #region Remove Operations

    /// <summary>
    /// Remove cache by key
    /// </summary>
    public void Remove(string key)
    {
        if (string.IsNullOrWhiteSpace(key))
        {
            Log.Warning("Cannot remove cache: key is null or empty");
            return;
        }

        _cache.Remove(key);

        // Remove from tracking
        foreach (var kvp in _cacheKeysByRefType)
        {
            if (kvp.Value.Contains(key))
            {
                RemoveCacheKeyFromTracking(kvp.Key, key);
                Log.Information("Removed cache for key: {CacheKey}", key);
                return;
            }
        }

        Log.Warning("Cache key not found in tracking: {CacheKey}", key);
    }

    /// <summary>
    /// Clear all cache by refType
    /// </summary>
    public void ClearByRefType(int refType)
    {
        if (_cacheKeysByRefType.TryGetValue(refType, out var cacheKeys))
        {
            var keysToRemove = cacheKeys.ToList();
            foreach (var key in keysToRemove)
            {
                _cache.Remove(key);
                Log.Debug("Removed cache key: {CacheKey}", key);
            }
            _cacheKeysByRefType.TryRemove(refType, out _);
            Log.Information("Cleared all cache for refType: {RefType}, total keys removed: {Count}",
                refType, keysToRemove.Count);
        }
        else
        {
            Log.Information("No cache found for refType: {RefType}", refType);
        }
    }

    /// <summary>
    /// Clear all cache
    /// </summary>
    public void ClearAll()
    {
        var totalKeys = 0;
        foreach (var kvp in _cacheKeysByRefType.ToList())
        {
            var keysToRemove = kvp.Value.ToList();
            foreach (var key in keysToRemove)
            {
                _cache.Remove(key);
                totalKeys++;
            }
        }
        _cacheKeysByRefType.Clear();
        Log.Information("Cleared all cache, total keys removed: {Count}", totalKeys);
    }

    /// <summary>
    /// Compact cache to free memory
    /// Note: IMemoryCache doesn't support explicit compacting like System.Runtime.Caching.MemoryCache
    /// Memory management is handled automatically by the ASP.NET Core memory cache
    /// </summary>
    public void CompactCache(double percentage = 1.0)
    {
        // if (_cache is MemoryCache memoryCache)
        // {
        //     memoryCache.Compact(percentage);
        //     Log.Information("Compacted cache with percentage: {Percentage}", percentage);
        // }
        // else
        // {
        //     Log.Warning("Cache is not MemoryCache type, cannot compact");
        // }

        // IMemoryCache (Microsoft.Extensions.Caching.Memory) doesn't have a Compact method
        // Memory management is handled automatically by the framework
        Log.Information("Cache compacting not supported for IMemoryCache. Memory management is handled automatically by ASP.NET Core. Requested percentage: {Percentage}", percentage);
    }

    #endregion

    #region Query Operations

    /// <summary>
    /// Get all cache keys grouped by refType
    /// </summary>
    public Dictionary<int, List<string>> GetAllCacheKeys()
    {
        // ✅ THÊM DÒNG NÀY
        Log.Information("📊 [Instance:{InstanceId}] GetAllCacheKeys called. Total refTypes: {Count}", 
            _instanceId, _cacheKeysByRefType.Count);

        var result = new Dictionary<int, List<string>>();

        foreach (var kvp in _cacheKeysByRefType)
        {
            // ✅ Remove duplicates when returning
            result[kvp.Key] = kvp.Value.Distinct().ToList();
        }

        Log.Debug("Retrieved all cache keys, total refTypes: {Count}", result.Count);
        return result;
    }

    /// <summary>
    /// Get all cache keys as flat list
    /// </summary>
    public List<string> GetAllCacheKeysList()
    {
        var allKeys = _cacheKeysByRefType
            .SelectMany(kvp => kvp.Value)
            .Distinct()
            .ToList();

        Log.Debug("Retrieved all cache keys as list, total keys: {Count}", allKeys.Count);
        return allKeys;
    }

    /// <summary>
    /// Get cache keys by specific refType
    /// </summary>
    public List<string> GetCacheKeysByRefType(int refType)
    {
        if (_cacheKeysByRefType.TryGetValue(refType, out var cacheKeys))
        {
            // ✅ Remove duplicates when returning
            var keys = cacheKeys.Distinct().ToList();
            Log.Debug("Retrieved cache keys for refType: {RefType}, total keys: {Count}",
                refType, keys.Count);
            return keys;
        }

        Log.Debug("No cache keys found for refType: {RefType}", refType);
        return new List<string>();
    }

    /// <summary>
    /// Get cache statistics
    /// </summary>
    public CacheStatistics GetStatistics()
    {
        var stats = new CacheStatistics
        {
            TotalRefTypes = _cacheKeysByRefType.Count,
            // ✅ Count distinct keys only
            TotalCacheKeys = _cacheKeysByRefType.Sum(kvp => kvp.Value.Distinct().Count()),
            RefTypeBreakdown = _cacheKeysByRefType.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Distinct().Count()
            )
        };

        Log.Debug("Cache statistics: {TotalRefTypes} refTypes, {TotalKeys} total keys",
            stats.TotalRefTypes, stats.TotalCacheKeys);

        return stats;
    }

    #endregion

    #region Private Helper Methods

    /// <summary>
    /// Track cache key by refType
    /// </summary>
    private void TrackCacheKey(int refType, string cacheKey)
    {
        // ✅ Check if key already exists to avoid duplicates
        if (_cacheKeysByRefType.TryGetValue(refType, out var existingBag))
        {
            if (existingBag.Contains(cacheKey))
            {
                Log.Warning("⚠️ [Instance:{InstanceId}] Cache key already tracked (skipping duplicate): {CacheKey} for RefType: {RefType}", 
                    _instanceId, cacheKey, refType);
                return;
            }
        }
        
        _cacheKeysByRefType.AddOrUpdate(
            refType,
            new ConcurrentBag<string> { cacheKey },
            (key, existingBag) =>
            {
                existingBag.Add(cacheKey);
                return existingBag;
            });

        // ✅ Log with distinct count
        var distinctCount = _cacheKeysByRefType[refType].Distinct().Count();
        Log.Information("✅ [Instance:{InstanceId}] Tracked cache key: {CacheKey} for RefType: {RefType}. Total distinct keys: {Count}", 
            _instanceId, cacheKey, refType, distinctCount);    
    }

    /// <summary>
    /// Remove cache key from tracking
    /// </summary>
    private void RemoveCacheKeyFromTracking(int refType, string cacheKey)
    {
        if (_cacheKeysByRefType.TryGetValue(refType, out var cacheKeys))
        {
            var updatedKeys = new ConcurrentBag<string>(
                cacheKeys.Where(k => k != cacheKey)
            );

            if (updatedKeys.IsEmpty)
            {
                _cacheKeysByRefType.TryRemove(refType, out _);
            }
            else
            {
                _cacheKeysByRefType.TryUpdate(refType, updatedKeys, cacheKeys);
            }
        }
    }

    #endregion
}

/// <summary>
/// Cache statistics model
/// </summary>
public class CacheStatistics
{
    public int TotalRefTypes { get; set; }
    public int TotalCacheKeys { get; set; }
    public Dictionary<int, int> RefTypeBreakdown { get; set; } = new();

    public override string ToString()
    {
        return $"Total RefTypes: {TotalRefTypes}, Total Cache Keys: {TotalCacheKeys}";
    }
}