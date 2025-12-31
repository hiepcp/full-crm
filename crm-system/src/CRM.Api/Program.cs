using CRMSys.Api.Middleware;
using CRMSys.Application;
using CRMSys.Infrastructure;
using Dapper;
using EvolveDb;
using Microsoft.OpenApi.Models;
using Serilog;
using Serilog.Events;
using Shared.AuthN.Extensions;
using Shared.AuthN.Middleware;
using Shared.AuthZ.Extensions;
using Shared.ExternalServices;
using System.Reflection;
using System.Text.Json;
using System.Text.Json.Serialization;

// C?u h�nh log
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .Enrich.FromLogContext()

    // Console - hi?n th? t?t c?
    .WriteTo.Console(
        outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj} " +
                        "(User={UserEmail}, Path={RequestPath}, Method={RequestMethod}){NewLine}{Exception}"
    )

    // File INFO - ch? log Information
    .WriteTo.Logger(lc => lc
        .Filter.ByIncludingOnly(evt => evt.Level == LogEventLevel.Information)
        .WriteTo.File(
            path: "logs/info/CRMiance-sys-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7,
            shared: true,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} " +
                            "(User={UserEmail}, Path={RequestPath}, Method={RequestMethod}, Agent={UserAgent}){NewLine}{Exception}"
        )
    )

    // File WARNING - ch? log Warning
    .WriteTo.Logger(lc => lc
        .Filter.ByIncludingOnly(evt => evt.Level == LogEventLevel.Warning)
        .WriteTo.File(
            path: "logs/warning/CRMiance-sys-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 7,
            shared: true,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} " +
                            "(User={UserEmail}, Path={RequestPath}, Method={RequestMethod}, Agent={UserAgent}){NewLine}{Exception}"
        )
    )

    // File ERROR - log Error v� Fatal
    .WriteTo.Logger(lc => lc
        .Filter.ByIncludingOnly(evt => evt.Level >= LogEventLevel.Error)
        .WriteTo.File(
            path: "logs/error/CRMiance-sys-.log",
            rollingInterval: RollingInterval.Day,
            retainedFileCountLimit: 30, // Gi? l�u hon cho error logs
            shared: true,
            outputTemplate: "{Timestamp:yyyy-MM-dd HH:mm:ss.fff zzz} [{Level:u3}] {Message:lj} " +
                            "(User={UserEmail}, Path={RequestPath}, Method={RequestMethod}, Agent={UserAgent}){NewLine}{Exception}"
        )
    )
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// c?u h�nh d? ch?y ssl ? local
//builder.WebHost.ConfigureKestrel(options =>
//{
//    options.ListenAnyIP(7141, listenOptions =>
//    {
//        listenOptions.UseHttps("./certs/wildcard.local.com.p12", "123456");
//    });
//});

// Deploy m? c�i n�y l�n
//builder.WebHost.ConfigureKestrel((context, options) =>
//{
//    options.Configure(context.Configuration.GetSection("Kestrel"));
//});

// Config
var cfg = builder.Configuration;

// Set Dapper dialect (MySQL)
SimpleCRUD.SetDialect(SimpleCRUD.Dialect.MySQL);
DefaultTypeMap.MatchNamesWithUnderscores = true;

// Add authentication from Shared.AuthN
builder.Services.AddResJwtAuthentication(cfg);

// Add authentication from Shared.AuthZ
builder.Services.AddResAuthZ();

// Add DJ Infrastructure
builder.Services.AddInfrastructure(cfg);

// Add memory cache
builder.Services.AddMemoryCache();

// Add SignalR for real-time notifications
builder.Services.AddSignalR();

// Add Background Services
builder.Services.AddHostedService<CRMSys.Infrastructure.BackgroundServices.DailyFollowUpReminderService>();

// Add DJ Application
builder.Services.AddApplication();

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();

// Đăng ký các dịch vụ external
builder.Services.AddSharepointExternalServices(builder.Configuration);
builder.Services.AddDynamicExternalServices(builder.Configuration);

// Th�m c?u h�nh Swagger v?i Bearer Token
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CRMSys Api", Version = "v1" });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);

    // C?u h�nh x�c th?c Bearer
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nh?p token theo d?nh d?ng: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    // C?u h�nh x�c th?c API Key
    c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "Nh?p API Key v�o header: XApiKey 2af189aa-ac90-11ef-8906-747827d4f13d",
        Name = "XApiKey",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    // �p d?ng c? Bearer v� ApiKey v�o y�u c?u b?o m?t
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        },
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "ApiKey"
                }
            },
            Array.Empty<string>()
        }
    });
});

// CORS cho FE localhost:3000
builder.Services.AddCors(o =>
{
    o.AddPolicy("Spa", p => p
        .WithOrigins(
            "https://crm.local.com:3000",
            "https://crm.local.com:5168",
            "https://CRM.local.com:3000",   // Case-sensitive fix
            "https://CRM.local.com:5168",   // Case-sensitive fix
            "https://localhost:3000",
            "http://localhost:3000",
            "https://localhost:5173",        // Vite dev server default port
            "http://localhost:5173",         // Vite dev server default port
            "https://dev.response.com.vn",
            "https://CRM-dev.response.com.vn",
            "https://crm-sandbox.response.com.vn",
            "https://crm-uat.response.com.vn")
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials()); // IMPORTANT: AllowCredentials for SignalR
});

// Add services to the container.

var app = builder.Build();

// Run Evolve database migrations
//try
//{
//    Log.Information("📦 Starting database migration...");

//    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
//        ?? throw new InvalidOperationException("DefaultConnection not found in appsettings.json");

//    using var connection = new MySql.Data.MySqlClient.MySqlConnection(connectionString);

//    var evolve = new EvolveDb.Evolve(connection, msg => Log.Debug(msg))
//    {
//        Locations = new List<string> { "Migrations" },
//        IsEraseDisabled = true, // CRITICAL: Disable erase in production
//        MetadataTableName = "changelog",
//        CommandTimeout = 60 // 60 seconds timeout for migrations
//    };

//    evolve.Migrate();

//    Log.Information("✅ Database migration completed successfully.");
//}
//catch (Exception ex)
//{
//    Log.Error(ex, "❌ Database migration failed: {ErrorMessage}", ex.Message);
//    throw; // Fail application startup if migration fails
//}

// Init database khi kh?i d?ng
//using (var scope = app.Services.CreateScope())
//{
//    var dbInit = scope.ServiceProvider.GetRequiredService<CRMSys.Infrastructure.DatabaseInit.DatabaseInitializer>();
//    await dbInit.InitializeAsync();
//}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("Spa");

// ValidationExceptionMiddleware d? show l?i FluentValidation
app.UseMiddleware<ValidationExceptionMiddleware>();

// Middleware x�c th?c API Key from Shared.AuthN
// Skip ApiKey check for SignalR hub endpoints (/hubs/*)
app.UseWhen(
    context => !context.Request.Path.StartsWithSegments("/hubs"),
    appBuilder => appBuilder.UseApiKeyAuth()
);

// Use authentication and authorization
app.UseAuthentication();

// add middleware log UserEmail from Shared.AuthN
app.UseUserLogging();

app.UseAuthorization();

// Map SignalR Hub
app.MapHub<CRMSys.Infrastructure.Hubs.NotificationHub>("/hubs/notifications");

app.MapControllers();
app.Run();
