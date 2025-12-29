# CRM.Application - Tầng Application

## Tổng quan
Tầng chứa business logic, services, DTOs, validators và AutoMapper configurations.

## Cấu trúc thư mục chính
```
CRM.Application/
├── Services/            # Business services implementations
├── Dtos/                # Data Transfer Objects
├── Validators/          # FluentValidation rules
├── Interfaces/          # Service interfaces
├── Mappings/            # AutoMapper profiles
├── DependencyInjection.cs # DI registration
└── CRM.Application.csproj
```

## Các file quan trọng
- `DependencyInjection.cs`: Đăng ký tất cả services
- `Services/*.cs`: Implement business logic
- `Validators/*.cs`: Validation rules

## Công nghệ & Dependencies
- **Validation**: FluentValidation
- **Mapping**: AutoMapper
- **DI**: Microsoft.Extensions.DependencyInjection

## Hướng dẫn chạy/Setup
- Không chạy độc lập, integrate vào CRM.Api
- Test: `dotnet test` từ solution root

## Tính năng chính
- Business use cases implementation
- Input validation
- Data transformation (DTOs)
- Service orchestration

## Liên kết với các layer khác
- **Depends on**: CRM.Domain, CRM.Infrastructure (interfaces)
- **Used by**: CRM.Api