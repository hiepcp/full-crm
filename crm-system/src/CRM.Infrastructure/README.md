# CRM.Infrastructure - Tầng Infrastructure

## Tổng quan
Tầng xử lý data access, repositories, external services và file storage.

## Cấu trúc thư mục chính
```
CRM.Infrastructure/
├── Repositories/        # Repository implementations (EF Core)
├── Services/            # Infrastructure services (Email, File, etc.)
├── DatabaseInit/        # DB initialization scripts
├── Sqls/                # Raw SQL queries
├── DependencyInjection.cs # DI registration
└── CRM.Infrastructure.csproj
```

## Các file quan trọng
- `DependencyInjection.cs`: Đăng ký DbContext, repositories
- `Repositories/*.cs`: CRUD operations
- `Sqls/*.sql`: Custom SQL scripts

## Công nghệ & Dependencies
- **Database**: SQL Server + EF Core
- **Key packages**: Microsoft.EntityFrameworkCore.SqlServer

## Hướng dẫn chạy/Setup
- Cấu hình DbContext trong appsettings
- Chạy migrations: `dotnet ef migrations add Initial` (từ CRM.Api)
- `dotnet ef database update`

## Tính năng chính
- Data persistence
- Repository pattern
- External integrations

## Liên kết với các layer khác
- **Depends on**: CRM.Domain, CRM.Application (interfaces)
- **Used by**: CRM.Application