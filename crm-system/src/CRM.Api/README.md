# CRM.Api - Tầng API

## Tổng quan
Tầng API chính, expose các REST endpoints, xử lý authentication, middleware và request/response.

## Cấu trúc thư mục chính
```
CRM.Api/
├── Controllers/         # Các API controllers
├── Middleware/          # Custom middleware
├── Utils/               # Utilities hỗ trợ
├── Properties/          # Launch settings và configs
├── Program.cs           # Cấu hình startup
├── appsettings.json     # File cấu hình
└── CRM.Api.csproj       # Project file
```

## Các file quan trọng
- `Program.cs`: Đăng ký services, middleware pipeline
- `appsettings.json` / `appsettings.Development.json`: Connection strings, JWT settings
- `CRM.Api.csproj`: Dependencies (.NET, Swashbuckle, etc.)

## Công nghệ & Dependencies
- **Framework**: .NET Core / .NET 8+
- **API Docs**: Swagger/OpenAPI
- **Auth**: JWT Bearer
- **Key packages**: Microsoft.AspNetCore.Authentication.JwtBearer, Swashbuckle.AspNetCore

## Hướng dẫn chạy/Setup
1. `cd CRM.Api`
2. `dotnet restore`
3. Cập nhật `appsettings.json` (connection string, JWT key)
4. `dotnet run`
5. Truy cập: `https://localhost:5001/swagger`

## Tính năng chính
- RESTful API endpoints
- Authentication & Authorization
- CORS configuration
- Logging & Error handling

## Liên kết với các layer khác
- **Depends on**: CRM.Application, CRM.Domain, CRM.Infrastructure
- **Used by**: Frontend clients (crm-system-client), External services