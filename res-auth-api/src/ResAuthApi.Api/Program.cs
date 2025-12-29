using Dapper;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using ResAuthApi.Api.Hubs;
using ResAuthApi.Api.Middleware;
using ResAuthApi.Api.Services;
using ResAuthApi.Api.Utils;
using ResAuthApi.Application.Interfaces;
using ResAuthApi.Infrastructure;
using ResAuthZApi.Application;
using ResAuthZApi.Infrastructure;
using Serilog;
using System.Reflection;

// Cấu hình log
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Debug()
    .MinimumLevel.Override("Microsoft", Serilog.Events.LogEventLevel.Warning) // Chỉ log Warning+ của Microsoft
    .MinimumLevel.Override("System", Serilog.Events.LogEventLevel.Warning) // Giảm bớt log từ System
    .WriteTo.Console()
    .WriteTo.File(
        path: "logs/resauthapi-.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7,
        shared: true
    )
    .CreateLogger();

var builder = WebApplication.CreateBuilder(args);

// cấu hình để chạy ssl ở local
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(7016, listenOptions =>
    {
        listenOptions.UseHttps("../../certs/wildcard.local.com.p12", "123456");
    });
});

// Deploy mở cái này lên
//builder.WebHost.ConfigureKestrel((context, options) =>
//{
//    options.Configure(context.Configuration.GetSection("Kestrel"));
//});

// Serilog
builder.Host.UseSerilog();

// Config
var cfg = builder.Configuration;

// Set Dapper dialect (MySQL)
SimpleCRUD.SetDialect(SimpleCRUD.Dialect.MySQL);

// Bật IMemoryCache
builder.Services.AddMemoryCache();

// DI Infrastructure
builder.Services.AddInfrastructure(cfg);

// DI Applicantion và Infrastructure
builder.Services.AddApplicationAuthZ().AddInfrastructureAuthZ(cfg);

// HttpClient + Services
builder.Services.AddHttpClient();
builder.Services.AddScoped<IAzureAdService, AzureAdService>();
builder.Services.AddScoped<ITokenService, TokenService>();
builder.Services.AddScoped<IAzureTokenService, AzureTokenService>();
builder.Services.AddScoped<IUserService, UserService>();

// RSA signing key (private)
var privateKeyPath = cfg["Jwt:PrivateKeyPath"]!;
var rsa = KeyLoader.LoadPrivateKeyFromPem(privateKeyPath);
var signingKey = new RsaSecurityKey(rsa) { KeyId = Guid.NewGuid().ToString() };
builder.Services.AddSingleton<RsaSecurityKey>(signingKey);

// AuthN (nếu cần verify nội bộ ở chính ResAuthApi)
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
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = signingKey
        };
    });

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
// Thêm cấu hình Swagger với Bearer Token
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "ResAuthApi", Version = "v1" });

    var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    c.IncludeXmlComments(xmlPath);

    // Cấu hình xác thực Bearer
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập token theo định dạng: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer"
    });

    // Cấu hình xác thực API Key
    c.AddSecurityDefinition("ApiKey", new OpenApiSecurityScheme
    {
        Description = "Nhập API Key vào header: XApiKey 2af189aa-ac90-11ef-8906-747827d4f13d",
        Name = "XApiKey",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey
    });

    // Áp dụng ApiKey vào yêu cầu bảo mật
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
        .WithOrigins("http://hr.local.com:3001", "https://hr.local.com:3001", 
                     "http://crm.local.com:3000", "https://crm.local.com:3000",
                     "http://compl.local.com:3002", "https://compl.local.com:3002", 
                     "https://compl.local.com:5168",
                     "https://dev.response.com.vn", "https://compl-dev.response.com.vn", 
                     "https://api-compl-dev.response.com.vn:7017",
                     "https://crm-sandbox.response.com.vn",
                     "https://crm-uat.response.com.vn"
                      )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});

// Background cleanup
builder.Services.AddHostedService<RefreshCleanupService>();

// Add SignalR
builder.Services.AddSignalR();

var app = builder.Build();

// Init database AuthN khi khởi động
//using (var scope = app.Services.CreateScope())
//{
//    var dbInit = scope.ServiceProvider.GetRequiredService<ResAuthApi.Infrastructure.DatabaseInit.DatabaseInitializer>();
//    await dbInit.InitializeAsync();
//}

// Init database AuthZ khi khởi động
//using (var scope = app.Services.CreateScope())
//{
//    var dbInit = scope.ServiceProvider.GetRequiredService<ResAuthZApi.Infrastructure.DatabaseInit.DatabaseInitializer>();
//    await dbInit.InitializeAsync();
//}

//if (app.Environment.IsDevelopment())
//{
app.UseSwagger();
    app.UseSwaggerUI();
//}

app.UseHttpsRedirection();
app.UseCors("Spa");

// Middleware API key
app.UseMiddleware<ApiKeyMiddleware>();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Map hub
app.MapHub<LogoutHub>("/hubs/logout");

app.Run();
