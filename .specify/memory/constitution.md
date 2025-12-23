<!--
Sync Impact Report
==================
Version: 1.0.0 → 1.1.0 (MINOR - New file preview principle added)
Modified Principles: N/A
Added Sections:
  - VI. File Management & Preview (New principle)
Removed Sections: N/A
Templates Requiring Updates:
  ✅ .specify/templates/plan-template.md - Constitution Check section aligns with principles
  ✅ .specify/templates/spec-template.md - Requirements sections align with security and functional needs
  ✅ .specify/templates/tasks-template.md - Task categorization supports architecture layers and testing discipline
  ✅ .specify/templates/agent-file-template.md - Generic template, no updates needed
  ✅ .specify/templates/checklist-template.md - Generic template, no updates needed
Follow-up TODOs: None
-->

# Full CRM System Constitution

## Core Principles

### I. Clean Architecture (Mandatory)

**This is NON-NEGOTIABLE across all three microservices (Frontend, CRM API, Auth API).**

- **Frontend MUST** follow the layered structure:
  - `app/` - Application core (routes, contexts, Redux store)
  - `presentation/` - UI layer (components, pages, layouts, themes)
  - `application/` - Use cases and business logic
  - `domain/` - Domain entities and business rules
  - `infrastructure/` - External concerns (API clients, services)
  - `utils/` - Shared utilities and constants

- **Backend APIs (.NET) MUST** follow the layered structure:
  - `*.Api/` - Presentation layer (controllers, middleware, Program.cs)
  - `*.Application/` - Application layer (services, interfaces, DTOs, validators, mappings)
  - `*.Domain/` - Domain layer (entities, enums, domain logic)
  - `*.Infrastructure/` - Infrastructure layer (repositories, external services, database initialization)

- **Dependency Rule**: Dependencies MUST point inward. Domain has no dependencies. Application depends only on Domain. Infrastructure and Api depend on Application and Domain.

- **Service Registration**: All services MUST be registered in dedicated `DependencyInjection.cs` files within Application and Infrastructure layers.

- **Rationale**: Clean Architecture ensures maintainability, testability, and clear separation of concerns across a complex three-tier microservices system. It prevents tight coupling between business logic and infrastructure concerns.

### II. Security-First Development

**Security is paramount in CRM systems handling sensitive customer data.**

- **Authentication & Authorization**:
  - MUST use separate Auth API for authentication (JWT tokens)
  - MUST implement dual authentication: API Key (`XApiKey` header) + JWT Bearer token
  - MUST use RSA private/public key pairs for JWT signing (NOT symmetric HMAC)
  - Refresh tokens MUST be single-use, httpOnly cookies that rotate on each refresh
  - Access tokens MUST be short-lived and stored in localStorage only
  - MUST redirect to login on 401, unauthorized page on 403

- **Data Protection**:
  - Passwords MUST be hashed (never logged or returned in responses)
  - Sensitive configuration (connection strings, JWT keys, API keys) MUST be in `appsettings.json` and NEVER committed
  - MUST use HTTPS in all environments (local development uses mkcert certificates)

- **Input Validation**:
  - All request DTOs MUST be validated using FluentValidation
  - MUST use ValidationExceptionMiddleware to handle validation errors consistently
  - MUST sanitize inputs to prevent XSS, SQL injection, and command injection

- **CORS Policy**:
  - MUST explicitly list allowed origins (no wildcards in production)
  - MUST use `.AllowCredentials()` for cookie-based refresh tokens
  - MUST validate origins match deployed frontend URLs

- **Audit Logging**:
  - MUST log all authentication events (login, logout, token refresh)
  - MUST log security events (authorization failures, suspicious activity)
  - MUST enrich logs with UserEmail, RequestPath, RequestMethod, UserAgent

- **Rationale**: CRM systems are high-value targets. Security must be built-in from the start, not added later. Separate Auth API enables centralized security management and future multi-tenant capabilities.

### III. API-Driven Design

**All functionality MUST be exposed through well-defined REST APIs.**

- **Endpoint Conventions**:
  - MUST use RESTful naming (`/customers`, `/leads`, `/deals`)
  - MUST support standard HTTP verbs (GET, POST, PUT, DELETE)
  - MUST use kebab-case or camelCase in URLs (consistent per service)
  - Query endpoints MUST use POST for complex filtering (avoid long query strings)

- **Request/Response DTOs**:
  - MUST separate DTOs from domain entities
  - Request DTOs MUST be suffixed with `Request` or specific action (e.g., `CreateCustomerRequest`)
  - Response DTOs MUST be suffixed with `Response` or `Dto`
  - MUST use object mapping (manual or AutoMapper) between entities and DTOs

- **Error Handling**:
  - MUST return consistent error responses with status codes, messages, and error codes
  - MUST use middleware for global exception handling
  - MUST log errors with stack traces (errors logged at Error level, warnings at Warning level)

- **API Documentation**:
  - Endpoint contracts SHOULD be documented (Swagger/OpenAPI when available)
  - Breaking changes MUST be communicated and versioned

- **Frontend Integration**:
  - Frontend MUST use axios instances with interceptors (`axiosInstance.js`)
  - MUST implement automatic token refresh on 401
  - MUST handle concurrent requests during token refresh with request queuing
  - API clients MUST be organized by module in `infrastructure/api/` (e.g., `customersApi.js`, `leadsApi.js`)

- **Rationale**: API-first design enables frontend-backend separation, allows multiple clients (web, mobile, integrations), and facilitates testing through contract tests.

### IV. Testing Discipline

**Testing is OPTIONAL but encouraged. When tests are written, they MUST follow these standards.**

- **Backend Testing** (.NET with xUnit):
  - Test projects MUST be in `tests/` directory with `.UnitTests` suffix
  - MUST use xUnit as the testing framework
  - MUST use coverlet.collector for coverage
  - Run with: `dotnet test` from test project directory

- **Frontend Testing** (React - framework TBD):
  - Test framework: Not yet configured
  - Mock data in `crm-system-client/src/data/` MAY be used during development
  - When implemented, tests SHOULD cover critical user flows and business logic

- **Integration Testing**:
  - MUST test critical integrations: Auth flow, external services (SharePoint, Dynamics), database operations
  - SHOULD test deal pipeline state transitions and lead conversion flows

- **Test-Driven Development**:
  - When TDD is adopted, tests MUST be written and fail before implementation
  - Follow Red-Green-Refactor cycle strictly

- **Rationale**: While tests are not currently mandatory, having clear testing standards ensures consistency when tests are added. Critical business logic (deal pipelines, lead conversion) benefits most from test coverage.

### V. Observability & Audit Trail

**System behavior MUST be observable through structured logging and audit trails.**

- **Structured Logging** (Serilog):
  - MUST use Serilog for all backend logging
  - MUST separate logs by level: `logs/info/`, `logs/warning/`, `logs/error/` (CRM API) OR combined logs (Auth API)
  - MUST use daily rolling file sink with retention policies (7-30 days)
  - MUST override Microsoft/System logs to Warning level to reduce noise
  - MUST enrich logs with contextual data (UserEmail, RequestPath, RequestMethod, UserAgent)

- **Business Audit Trails**:
  - Critical state changes MUST be logged in audit tables:
    - `pipeline_logs` - Deal stage transitions with timestamp, user, reason
    - Lead conversion MUST record which user converted the lead and when
  - MUST track who created/modified entities (created_by, updated_by fields)

- **Performance Monitoring**:
  - SHOULD log slow queries and API response times
  - SHOULD monitor external service call failures (SharePoint, Dynamics)

- **Error Tracking**:
  - MUST log exceptions with full stack traces
  - MUST log validation failures with details
  - Frontend SHOULD log client-side errors to a central service (future enhancement)

- **Rationale**: CRM systems require detailed audit trails for compliance, debugging, and understanding user behavior. Structured logs enable queryable diagnostics and troubleshooting.

### VI. File Management & Preview

**File attachments MUST support preview functionality for common document and image formats.**

- **Activity Attachments**:
  - Activity attachments MUST be stored in `crm_activity_attachment` table with `IdRef` reference
  - `IdRef` field MUST uniquely identify the file for retrieval and preview
  - MUST support file metadata: `FileName`, `FilePath`, `FileSize`, `MimeType`
  - MUST provide computed properties: `FileExtension`, `IsImage`, `IsDocument`, `DisplaySize`, `DisplayName`

- **File Preview Component**:
  - MUST use `FilePreviewer` component (or equivalent) for rendering file previews
  - MUST support preview of common formats:
    - **PDF**: Display inline using `<iframe>` or PDF viewer
    - **Images**: Display inline with responsive sizing
    - **Word documents (.docx)**: Render using `docx-preview` library
    - **Excel files (.xlsx)**: Render using LuckySheet or similar library
  - MUST handle unsupported file types gracefully with user-friendly messages
  - MUST show loading states during file fetch and render
  - MUST show error states when file preview fails

- **File Retrieval**:
  - MUST implement file retrieval by `IdRef` through dedicated use case or API endpoint
  - MUST return file content as base64-encoded string with metadata (`content`, `contentType`, `fileName`)
  - MUST validate file access permissions before serving content
  - MUST handle large files appropriately (consider streaming for very large files)

- **Integration Points**:
  - Activity attachment list components MUST integrate preview functionality (e.g., preview icon/button)
  - MUST support both inline preview (modal/dialog) and external link opening
  - Preview component MUST be reusable across different entity types (activities, deals, customers, etc.)

- **Performance Considerations**:
  - SHOULD cache file content for repeated previews within same session
  - SHOULD lazy-load preview components to reduce initial bundle size
  - MUST provide option to download file instead of preview for large documents

- **Rationale**: File preview enhances user experience by allowing quick document review without downloading. Consistent preview patterns across the CRM improve usability and reduce context switching. Using `IdRef` as the file identifier ensures flexibility with external storage systems (SharePoint, file system, cloud storage).

## Development Workflow

### Branching & Versioning

- **Branch Strategy**: Feature branches from `master`
- **Naming**: `###-feature-name` format (e.g., `001-customer-api`)
- **Commits**: Descriptive messages, commit after each logical task or group
- **Pull Requests**: Required for merging to main branch

### Code Quality Gates

- **Frontend**:
  - MUST pass `npm run lint` (no linting errors)
  - SHOULD run `npm run lint:fix` before committing
  - SHOULD format code with `npm run prettier`

- **Backend**:
  - MUST build without errors (`dotnet build`)
  - MUST pass `dotnet test` if tests exist
  - MUST restore packages (`dotnet restore`) before building

### Environment-Specific Builds

- **Frontend**:
  - Development: `npm run dev` → https://crm.local.com:3000
  - Sandbox: `npm run build:sandbox`
  - UAT: `npm run build:uat`
  - Production: `npm run build:prod`
  - Preview: `npm run preview` → port 5168

- **Backend**:
  - Development: `dotnet run` (HTTPS enabled)
  - Release: `dotnet build -c Release`

### Local Development Requirements

- **HTTPS Certificates**: MUST use mkcert to generate local SSL certificates for all three services
- **Hosts File**: MUST configure local domains (`crm.local.com`, `api-auth.local.com`, `api-crm.local.com`)
- **Environment Variables**: MUST configure `.env` for frontend with API URLs, Azure AD tenant/client IDs, API key
- **Database**: MUST have MySQL running with proper connection strings in `appsettings.json`

## Quality Standards

### Performance

- **Database Operations**:
  - MUST use Dapper with SimpleCRUD for data access
  - MUST use MySQL dialect configuration
  - MUST map table names with underscores (`DefaultTypeMap.MatchNamesWithUnderscores = true`)

- **Frontend**:
  - SHOULD use React best practices (memoization, lazy loading)
  - SHOULD optimize bundle size
  - SHOULD handle loading states and errors gracefully

### Code Style & Naming Conventions

- **React Components**: `PascalCase.jsx` (e.g., `CustomerList.jsx`)
- **Directories**: `kebab-case` (e.g., `customer-list/`)
- **C# Files**: `PascalCase.cs` (e.g., `CustomerService.cs`)
- **API Endpoints**: `kebab-case` or `camelCase` (e.g., `/customers`, `/query-domain`)
- **Database Tables**: `snake_case` (e.g., `customer_addresses`, `deal_quotations`)
- **Constants**: Centralized in `crm-system-client/src/utils/constants.js` (LEAD_SOURCES, LEAD_STATUSES, ACTIVITY_TYPES, etc.)

### Documentation

- **MUST maintain**: `CLAUDE.md` with comprehensive project guidance
- **SHOULD document**: Critical business logic in dedicated README files (e.g., `DEAL_README.md` for pipeline logic)
- **SHOULD provide**: Setup instructions in component README files

## Architecture Standards

### Dependency Injection

- All services MUST be registered in `DependencyInjection.cs`
- MUST use constructor injection
- MUST register with appropriate lifetime (Scoped for per-request, Singleton for shared state, Transient for stateless)

### Repository Pattern

- Data access MUST be abstracted through repository interfaces (e.g., `ICustomerRepository`)
- Repositories MUST be implemented in Infrastructure layer
- SQL queries SHOULD be centralized in `Infrastructure/Sqls/` directory

### Middleware Pipeline

- MUST include: ValidationExceptionMiddleware, ApiKeyMiddleware, UserLoggingMiddleware
- MUST configure in proper order in `Program.cs`
- Error handling middleware MUST be first in pipeline

### External Service Integrations

- **SharePoint**: Document management via `Shared.ExternalServices.dll`
- **Dynamics 365**: CRM category synchronization via `Shared.ExternalServices.dll`
- **Azure AD**: Frontend authentication via `@azure/msal-react`
- **SignalR**: Real-time logout notifications from Auth API

## Critical Business Rules

### Deal Pipeline Management

- Deal stages MUST follow: Qualify → Develop → Propose → Close (Won/Lost)
- Stage transitions MUST be automatic based on quotation statuses:
  - Any quotation "Converted to Sales Order" → Deal = "Close/Won"
  - All quotations "Rejected" → Deal = "Close/Lost"
  - Any quotation "Pending" → Deal = "Propose"
- Stage changes MUST be logged in `pipeline_logs` table with timestamp, user, and reason
- Reference: `crm-system-client/rule/DEAL_README.md`

### Lead Conversion Flow

- Lead conversion MUST:
  1. Create Customer from lead data
  2. Create Contact from lead contact info
  3. Optionally create Deal with converted customer
  4. Mark Lead as "Converted" (`is_converted = true`)
  5. Link to created customer/contact/deal records

## Governance

### Constitution Authority

- This constitution supersedes all other development practices
- All feature planning, design, and implementation MUST comply with these principles
- Deviations MUST be documented and justified in `Complexity Tracking` section of plan.md

### Amendment Process

- Amendments require:
  1. Documentation of rationale and impact analysis
  2. Review and approval by project maintainers
  3. Version increment following semantic versioning
  4. Update of dependent templates and guidance files
  5. Communication to all team members

### Versioning Policy

- **MAJOR**: Backward incompatible governance changes, principle removals, or redefinitions
- **MINOR**: New principles added, sections expanded, material guidance additions
- **PATCH**: Clarifications, wording improvements, typo fixes, non-semantic refinements

### Compliance Review

- All pull requests MUST verify compliance with constitution principles
- Code reviews MUST check for:
  - Clean Architecture layer separation
  - Security requirements (authentication, validation, HTTPS)
  - Logging and audit trail implementation
  - Naming conventions and code style
  - API contract consistency

### Runtime Development Guidance

- Use `CLAUDE.md` for detailed runtime development instructions
- Use feature-specific README files for critical business logic documentation
- Use `.specify/templates/` for consistent feature planning and task breakdown

**Version**: 1.1.0 | **Ratified**: 2025-12-22 | **Last Amended**: 2025-12-23
