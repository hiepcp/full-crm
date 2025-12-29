using Dapper;
using Evolve;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using MySql.Data.MySqlClient;
using Serilog;
using System.Reflection;

// Configure logging
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning)
    .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning)
    .WriteTo.Console()
    .WriteTo.File(
        path: "logs/crm-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        shared: true
    )
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// Configure Kestrel for local SSL
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(7141, listenOptions =>
    {
        listenOptions.UseHttps("../../certs/wildcard.local.com.p12", "123456");
    });
});

// Serilog
builder.Host.UseSerilog();

// Config
var cfg = builder.Configuration;

// Set Dapper dialect (MySQL)
SimpleCRUD.SetDialect(SimpleCRUD.Dialect.MySQL);

// Enable IMemoryCache
builder.Services.AddMemoryCache();

// HttpClient + Services
builder.Services.AddHttpClient();

// Authentication
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opts =>
    {
        opts.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = cfg["Jwt:Issuer"],
            ValidateAudience = false,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Configure Swagger with Bearer Token
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "CRM API", Version = "v1" });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath))
    {
        c.IncludeXmlComments(xmlPath);
    }

    // Configure Bearer authentication
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Enter token in format: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

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
        }
    });
});

// CORS configuration
builder.Services.AddCors(o =>
{
    o.AddPolicy("Spa", p => p
        .WithOrigins(
            "http://crm.local.com:3000", "https://crm.local.com:3000",
            "https://crm-sandbox.response.com.vn",
            "https://crm-uat.response.com.vn"
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

var app = builder.Build();

// Run database migrations using Evolve
try
{
    Log.Information("📦 Starting database migrations...");

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("DefaultConnection not found in appsettings.json");

    using var connection = new MySqlConnection(connectionString);
    var evolve = new Evolve.Evolve(connection, msg => Log.Debug(msg))
    {
        Locations = new[] { "Migrations" },
        IsEraseDisabled = true, // CRITICAL: Disable erase in production
        MetadataTableName = "changelog",
        CommandTimeout = 60 // 60 seconds timeout for migrations
    };

    evolve.Migrate();

    Log.Information("✅ Database migrations completed successfully.");
}
catch (Exception ex)
{
    Log.Error(ex, "❌ Database migration failed: {ErrorMessage}", ex.Message);
    throw; // Fail application startup if migration fails
}

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("Spa");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
