// ==============================================================================
// Excel Preview Cache Middleware Registration
// ==============================================================================
// This file demonstrates how to register the ExcelPreviewCacheMiddleware in Program.cs
// T067, T068: Register MemoryCache and middleware
//
// INSTRUCTIONS:
// Add these snippets to your actual Program.cs file in the CRM.Api project
// ==============================================================================

using Microsoft.Extensions.Caching.Memory;
using CRM.Api.Configuration;
using CRM.Api.Middleware;

// ==============================================================================
// 1. SERVICES CONFIGURATION (Add to builder.Services section)
// ==============================================================================

// T067: Register MemoryCache with size limit and compaction
builder.Services.AddMemoryCache(options =>
{
    // 100MB max cache size (configurable via appsettings.json)
    options.SizeLimit = 100 * 1024 * 1024;

    // When cache is full, evict 25% of least recently used entries
    options.CompactionPercentage = 0.25;

    // Track memory usage for monitoring
    options.ExpirationScanFrequency = TimeSpan.FromMinutes(5);
});

// Register cache options from configuration
builder.Services.Configure<ExcelPreviewCacheOptions>(
    builder.Configuration.GetSection("ExcelPreviewCache")
);

// ==============================================================================
// 2. MIDDLEWARE PIPELINE (Add BEFORE app.UseAuthentication())
// ==============================================================================

// T068: Register ExcelPreviewCacheMiddleware before authentication
// This ensures cache is checked early in the pipeline
app.UseExcelPreviewCache();

// Then continue with existing middleware
app.UseAuthentication();
app.UseAuthorization();

// ==============================================================================
// 3. APPSETTINGS.JSON CONFIGURATION (Optional - uses defaults if omitted)
// ==============================================================================

/*
{
  "ExcelPreviewCache": {
    "MaxCacheSizeBytes": 104857600,  // 100 MB
    "SlidingExpiration": "00:15:00",  // 15 minutes
    "CompactionPercentage": 0.25,      // Evict 25% when full
    "EnableStatistics": true,          // Log cache hits/misses
    "EnableUserIsolation": true        // Separate cache per user
  }
}
*/

// ==============================================================================
// EXAMPLE: Full Program.cs structure
// ==============================================================================

/*
var builder = WebApplication.CreateBuilder(args);

// Add services
builder.Services.AddControllers();
builder.Services.AddMemoryCache(options => {
    options.SizeLimit = 100 * 1024 * 1024;
    options.CompactionPercentage = 0.25;
});
builder.Services.Configure<ExcelPreviewCacheOptions>(
    builder.Configuration.GetSection("ExcelPreviewCache")
);

var app = builder.Build();

// Configure middleware pipeline
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
}

app.UseHttpsRedirection();
app.UseCors("Spa");

// IMPORTANT: Add cache middleware BEFORE authentication
app.UseExcelPreviewCache();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
*/
