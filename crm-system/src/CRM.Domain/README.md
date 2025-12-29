# CRM.Domain - Tầng Domain

## Tổng quan
Tầng core chứa domain entities, value objects, enums và business rules thuần túy.

## Cấu trúc thư mục chính
```
CRM.Domain/
├── Entities/            # Business entities (Customers, Leads, Deals, etc.)
├── Dynamics/            # Dynamic entities (nếu có)
└── CRM.Domain.csproj
```

## Các file quan trọng
- `Entities/*.cs`: Domain models với EF configurations
- Enums/Constants trong Entities

## Công nghệ & Dependencies
- **ORM**: Entity Framework Core (Fluent API)
- Pure POCO classes, không dependencies external

## Hướng dẫn chạy/Setup
- Không chạy độc lập
- Referenced bởi tất cả layers khác

## Tính năng chính
- Domain models definition
- Business invariants enforcement
- Value objects (nếu áp dụng DDD)

## Liên kết với các layer khác
- **Core layer**: Không depend trên layer nào
- **Used by**: CRM.Application, CRM.Infrastructure