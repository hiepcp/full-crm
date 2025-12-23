# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack CRM (Customer Relationship Management) system consisting of three main parts:

1. **crm-system-client** - React frontend application
2. **crm-system** - .NET 8 CRM backend API
3. **res-auth-api** - .NET 8 Authentication & Authorization API

## System Architecture

### Three-Tier Microservices Architecture

The system follows Clean Architecture principles with clear separation between:

- **Frontend**: React SPA with Material-UI, running at https://crm.local.com:3000
- **CRM API**: .NET 8 Web API with Clean Architecture (Domain/Application/Infrastructure/Api layers)
- **Auth API**: Separate authentication service handling JWT tokens, Azure AD integration, and SignalR for logout notifications

### Authentication Flow

1. User authenticates via Azure AD or login form → **res-auth-api**
2. Auth API returns JWT access token + refresh token (httpOnly cookie)
3. Frontend stores access token in localStorage, includes in all CRM API requests
4. Axios interceptor auto-refreshes expired tokens
5. 401/403 errors trigger redirect to login/unauthorized pages

## Development Commands

### Frontend (crm-system-client)

```bash
# Install dependencies
npm install

# Development server (https://crm.local.com:3000)
npm run dev

# Build for different environments
npm run build              # Development build
npm run build:sandbox      # Sandbox build
npm run build:uat          # UAT build
npm run build:prod         # Production build

# Code quality
npm run lint               # Check for linting errors
npm run lint:fix           # Auto-fix linting errors
npm run prettier           # Format code with Prettier

# Preview production build
npm run preview            # Runs on port 5168
```

### Backend - CRM System (crm-system)

```bash
# Navigate to solution directory
cd crm-system

# Restore dependencies
dotnet restore

# Build solution
dotnet build

# Run API (development with HTTPS)
cd src/CRM.Api
dotnet run

# Run tests
cd tests/CRMApi.UnitTests
dotnet test

# Build for release
dotnet build -c Release
```

### Backend - Auth API (res-auth-api)

```bash
# Navigate to solution directory
cd res-auth-api

# Restore and build
dotnet restore
dotnet build

# Run Auth API
cd src/ResAuthApi.Api
dotnet run

# The API runs on https://localhost:7016 (configured in Program.cs)
```

## Architecture Deep Dive

### Frontend Architecture (Clean Architecture)

```
src/
├── app/                    # Application core (routes, contexts, store)
│   ├── contexts/          # React contexts (RoleProfile, EmailConnection)
│   ├── routes/            # Route configuration (MainRoutes, LoginRoutes)
│   └── store/             # Redux store configuration
├── presentation/          # UI layer
│   ├── components/        # Reusable UI components
│   ├── pages/            # Page components (dashboard, customer, lead, deal, etc.)
│   ├── layouts/          # Layout components (MainLayout, AuthLayout)
│   └── themes/           # MUI theme configuration
├── application/          # Use cases and business logic
├── domain/               # Domain entities and business rules
├── infrastructure/       # External concerns (API clients, services)
│   └── api/             # API client modules (customersApi, leadsApi, etc.)
└── utils/               # Shared utilities and constants
```

### Backend Architecture (.NET Clean Architecture)

Both CRM and Auth APIs follow the same layered structure:

```
src/
├── *.Api/                 # Presentation layer
│   ├── Controllers/       # API endpoints
│   ├── Middleware/        # Request pipeline (validation, error handling)
│   └── Program.cs         # App configuration, DI, Serilog
├── *.Application/         # Application layer
│   ├── Services/          # Business logic implementation
│   ├── Interfaces/        # Service contracts
│   ├── Dtos/             # Data transfer objects
│   ├── Validators/        # FluentValidation validators
│   └── Mappings/         # Object mappings
├── *.Domain/             # Domain layer
│   ├── Entities/         # Domain entities (Customer, Lead, Deal, etc.)
│   └── Enums/            # Domain enumerations
└── *.Infrastructure/     # Infrastructure layer
    ├── Repositories/     # Data access with Dapper
    ├── Services/         # External service integrations
    └── DatabaseInit/     # Database initialization
```

### Key Architectural Patterns

1. **Dependency Injection**: All services registered in `DependencyInjection.cs` files
2. **Repository Pattern**: Data access abstracted through interfaces (ICustomerRepository, etc.)
3. **DTO Pattern**: Request/Response DTOs separate from domain entities
4. **Middleware Pipeline**: ValidationExceptionMiddleware, ApiKeyMiddleware, UserLogging
5. **CQRS-lite**: Query vs Command separation in Application layer

## Critical Domain Logic

### Deal Pipeline Management

The system implements a sophisticated deal pipeline with automatic stage transitions based on quotation status:

**Pipeline Stages**: Qualify → Develop → Propose → Close (Won/Lost)

**Business Rules**:
- Deal stage automatically updates based on quotation statuses
- If any quotation is "Converted to Sales Order" → Deal = "Close/Won"
- If all quotations are "Rejected" → Deal = "Close/Lost"
- If any quotation is "Pending" → Deal = "Propose"
- Stage changes are logged in `PipelineLog` table

**Database Tables**:
- `deals` - Main deal entity
- `deal_quotations` - Quotations linked to deals
- `pipeline_logs` - Audit trail of stage changes

Reference: `crm-system-client/rule/DEAL_README.md` for complete pipeline logic

### Lead Conversion Flow

When converting a lead:
1. Create Customer from lead data
2. Create Contact from lead contact info
3. Create Deal (optional) with converted customer
4. Mark Lead as "Converted"
5. Set `is_converted = true` and link to created records

### Authentication Token Management

**Token Types**:
- **Access Token**: Short-lived JWT (stored in localStorage), includes user claims
- **Refresh Token**: Long-lived, stored in httpOnly cookie, rotates on use

**Auto-Refresh Logic** (axiosInstance.js):
- Before each request, check if access token is expired
- If expired, call `/refresh` endpoint with credentials
- Queue concurrent requests during refresh
- On 401, clear storage and redirect to login
- On 403, redirect to unauthorized page

## Database Configuration

### CRM System Database
- **Type**: MySQL
- **Dialect**: Configured via `SimpleCRUD.SetDialect(SimpleCRUD.Dialect.MySQL)`
- **ORM**: Dapper with SimpleCRUD
- **Naming**: Uses underscore naming (`DefaultTypeMap.MatchNamesWithUnderscores = true`)

### Auth System Database
- **Type**: MySQL
- **Tables**:
  - Authentication: `users`, `refresh_tokens`, `api_keys`
  - Authorization: `roles`, `permissions`, `role_permissions`, `user_roles`

### Connection Strings
Located in `appsettings.json` and `appsettings.Development.json` for each API project.

## External Integrations

### SharePoint Integration
The CRM system integrates with SharePoint for document management via `Shared.ExternalServices` library:
- Document upload/download
- Folder structure management
- Configured in `Program.cs` via `AddSharepointExternalServices()`

### Dynamics 365 Integration
Integration with Microsoft Dynamics for CRM categories:
- Configured via `AddDynamicExternalServices()`
- Category synchronization

### Azure AD Authentication
Frontend uses `@azure/msal-react` for Azure AD login:
- Tenant ID and Client ID configured in `.env`
- Redirect URI: https://crm.local.com:3000
- Token acquisition handled by MSAL library

## SSL/HTTPS Configuration

### Local Development Requirements

**Required for all three services** to communicate properly:

1. **Certificates Setup**:
```bash
# Install mkcert
# Download from: https://github.com/FiloSottile/mkcert/releases

# Install local CA
mkcert -install

# Generate wildcard cert for frontend
mkcert "*.local.com"

# Generate PKCS12 certs for backend APIs
mkcert api-auth.local.com
openssl pkcs12 -export -out wildcard.local.com.p12 -inkey _wildcard.local.com-key.pem -in _wildcard.local.com.pem -password pass:123456
```

2. **Hosts File** (`C:\Windows\System32\drivers\etc\hosts`):
```
127.0.0.1 crm.local.com
127.0.0.1 api-auth.local.com
127.0.0.1 api-crm.local.com
```

3. **Certificate Locations**:
- Frontend: `crm-system-client/certs/`
- CRM API: `crm-system/certs/`
- Auth API: `res-auth-api/certs/`

## Important Configuration Files

### Frontend Environment Variables (.env)
```
VITE_API_AUTH=https://api-auth.local.com
VITE_API_URL=https://api-crm.local.com
VITE_API_AUTHZ=https://api-auth.local.com
VITE_TENANT_ID=<azure-tenant-id>
VITE_CLIENT_ID=<azure-client-id>
VITE_X_API_KEY=<api-key-for-backend>
```

### Backend Configuration (appsettings.json)

Both APIs require:
- Database connection strings
- JWT settings (Issuer, Audience, PrivateKeyPath for Auth API)
- Logging configuration (Serilog)
- CORS origins (must include all frontend URLs)
- External service credentials (SharePoint, Dynamics)

## Logging Strategy

### Backend Logging (Serilog)

**CRM API** (`CRM.Api/Program.cs`):
- Separate log files by level: `logs/info/`, `logs/warning/`, `logs/error/`
- Console output for development
- File rolling: Daily for info/warning, 30 days retention for errors
- Enriched with: UserEmail, RequestPath, RequestMethod, UserAgent

**Auth API** (`ResAuthApi.Api/Program.cs`):
- Combined log file: `logs/resauthapi-.log`
- Daily rolling, 7 days retention
- Overrides Microsoft/System logs to Warning level

## Testing

### Frontend Testing
- Test framework: Not yet configured
- Mock data: Located in `crm-system-client/src/data/` for development

### Backend Testing
- Framework: xUnit (.NET 9)
- Test project: `CRMApi.UnitTests`
- Coverage: coverlet.collector
- Run: `dotnet test` from test project directory

## Current Development Status

**✅ Completed**:
- Authentication & Authorization API (fully functional)
- Frontend UI for all major modules (Dashboard, Customer, Lead, Deal, Contact, Activity)
- Clean Architecture structure for all projects
- Azure AD integration
- SignalR hub for real-time logout notifications

**⚠️ In Progress**:
- CRM Backend APIs - Only CRM Category module implemented
- Database schema implementation
- API-Frontend integration (currently using mock data)

**❌ Not Implemented** (Priority Order):
1. Customer API (highest priority - foundation for all CRM operations)
2. Lead API
3. Deal API (includes pipeline management logic)
4. Contact API
5. Activity API
6. Quotation API
7. Document API

## Common Development Patterns

### Adding a New Entity to CRM System

1. **Domain Layer**: Create entity in `CRM.Domain/Entities/`
2. **Application Layer**:
   - Create DTOs in `CRM.Application/Dtos/`
   - Create service interface in `CRM.Application/Interfaces/`
   - Implement service in `CRM.Application/Services/`
   - Add validators in `CRM.Application/Validators/`
3. **Infrastructure Layer**:
   - Create repository interface and implementation in `CRM.Infrastructure/Repositories/`
   - Add SQL queries in `CRM.Infrastructure/Sqls/`
4. **API Layer**:
   - Create controller in `CRM.Api/Controllers/`
5. **Register Services**: Update `DependencyInjection.cs` in Application and Infrastructure

### Adding a New Frontend Page

1. Create page component in `src/presentation/pages/{module}/`
2. Create route in `src/app/routes/groups/MainRoutes.jsx`
3. Add menu item in menu configuration
4. Create API client in `src/infrastructure/api/{module}Api.js`
5. Add constants to `src/utils/constants.js` if needed

## Important Code Locations

### Shared Libraries (NuGet Packages)
- `Res.Shared.AuthN` (v1.0.3) - JWT authentication middleware and extensions
- `Res.Shared.AuthZ` (v1.0.3) - Authorization middleware
- `Shared.ExternalServices.dll` - SharePoint/Dynamics integrations (local DLL reference)

### Redux Store
- Configuration: `crm-system-client/src/app/store/`
- Slices per module (if using Redux Toolkit)

### API Interceptors
- `crm-system-client/src/infrastructure/api/axiosInstance.js` - Main HTTP client with auth
- `crm-system-client/src/infrastructure/api/menuAxiosInstance.js` - Separate instance for menu API

### Constants & Utilities
- `crm-system-client/src/utils/constants.js` - Centralized constants (LEAD_SOURCES, LEAD_STATUSES, ACTIVITY_TYPES, etc.)
- `crm-system-client/src/utils/tokenHelper.js` - Token management utilities
- `crm-system-client/src/utils/dateHelper.js` - Date formatting utilities

## CORS Configuration

All backend APIs must include frontend origins in CORS policy:

```csharp
builder.Services.AddCors(o => {
    o.AddPolicy("Spa", p => p
        .WithOrigins(
            "https://crm.local.com:3000",    // Development
            "https://crm.local.com:5168",    // Preview
            "https://crm-dev.response.com.vn",     // Dev environment
            "https://crm-sandbox.response.com.vn", // Sandbox
            "https://crm-uat.response.com.vn"      // UAT
        )
        .AllowAnyHeader()
        .AllowAnyMethod()
        .AllowCredentials());
});
```

## Security Considerations

### API Key Authentication
Both CRM and Auth APIs use API key middleware (`XApiKey` header) in addition to JWT:
- Required for all API requests
- Configured in `appsettings.json`
- Validated by `ApiKeyMiddleware` (Auth API) or `UseApiKeyAuth()` (CRM API from Shared.AuthN)

### JWT Token Security
- **Signing**: RSA private/public key pair (not symmetric HMAC)
- **Private Key**: Loaded from PEM file specified in `Jwt:PrivateKeyPath`
- **Public Key**: Other services verify using public key
- **Rotation**: Refresh tokens are single-use and rotate on each refresh

### Password Storage
- Passwords are hashed (implementation in Auth API)
- Never logged or returned in API responses

## Troubleshooting

### Common Issues

**Frontend can't connect to backend**:
- Verify all services are running with HTTPS
- Check CORS configuration includes the frontend origin
- Verify certificates are properly installed and trusted
- Check hosts file entries

**Token refresh fails**:
- Ensure refresh token cookie is httpOnly and sent with credentials
- Verify `withCredentials: true` in axios refresh request
- Check Auth API is accessible

**Database connection fails**:
- Verify connection string in `appsettings.json`
- Ensure MySQL server is running
- Check database user permissions
- Run `DatabaseInitializer` on first startup (commented out in Program.cs)

**Build errors in .NET projects**:
- Restore NuGet packages: `dotnet restore`
- Clean and rebuild: `dotnet clean && dotnet build`
- Check for missing Shared library DLL references

## File Naming Conventions

- **React Components**: `PascalCase.jsx` (e.g., `CustomerList.jsx`)
- **Directories**: `kebab-case` (e.g., `customer-list/`)
- **C# Files**: `PascalCase.cs` (e.g., `CustomerService.cs`)
- **API Endpoints**: `kebab-case` or `camelCase` (e.g., `/customers`, `/query-domain`)
- **Database Tables**: `snake_case` (e.g., `customer_addresses`, `deal_quotations`)

## Additional Resources

Important README files in the repository:
- `crm-system-client/rule/DEAL_README.md` - Deal pipeline business logic
- `crm-system-client/rule/README_ESTIMATE.md` - Development estimates and status
- `crm-system-client/rule/DETAIL_PAGES_README.md` - Detail page implementation guide
- `crm-system-client/README.md` - Frontend setup and development guide
- `crm-system-client/database/README.md` - Database setup (outdated, references PostgreSQL)
