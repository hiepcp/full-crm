# Research: Sales Team Management Feature

**Feature**: Sales Team Management
**Branch**: 002-sales-team-management
**Date**: 2025-12-30

## Context

The sales team management feature will allow users to create and manage sales teams, assign team members with roles, and optionally link teams to deals and customers. The specification is well-defined with clear functional requirements, user stories, and acceptance scenarios.

## Technical Decisions Made

### Decision 1: Data Model Approach

**Status**: **RESOLVED**

**Question**: What is the appropriate data model for sales teams and team members?

**Decision**: Use two-table model with separate `crm_sales_teams` and `crm_team_members` tables.

**Rationale**:
- Clean separation of concerns: teams as entities, members as relationships
- Supports the requirement for users to belong to multiple teams (FR-019)
- Follows existing CRM patterns (e.g., deals/customers with related tables)
- Easy to add team roles (Team Lead, Member, Observer) as enum or lookup
- Enables proper foreign key relationships to deals and customers

**Alternatives Considered**:
1. **Single table with JSON array**: Would make querying team membership complex, violates normalization
2. **Denormalized team_id on users**: Doesn't support multiple team membership
3. **Role-based access control tables**: Over-engineering for current requirements

**Database Schema**:
```sql
CREATE TABLE crm_sales_teams (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  CreatedBy VARCHAR(255) NOT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255),
  UpdatedOn DATETIME ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_teams_name (name)
);

CREATE TABLE crm_team_members (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  team_id BIGINT NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  role ENUM('TeamLead', 'Member', 'Observer') NOT NULL DEFAULT 'Member',
  joined_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CreatedBy VARCHAR(255) NOT NULL DEFAULT 'system',
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255),
  UpdatedOn DATETIME ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES crm_sales_teams(id) ON DELETE CASCADE,
  FOREIGN KEY (user_email) REFERENCES crm_user(email) ON DELETE CASCADE,
  UNIQUE KEY uk_members_team_user (team_id, user_email)
);
```

---

### Decision 2: API Endpoint Design

**Status**: **RESOLVED**

**Question**: What REST API endpoints are needed for team management?

**Decision**: Standard RESTful CRUD endpoints for teams and nested endpoints for team members.

**Rationale**:
- Follows REST best practices and existing CRM API patterns
- Intuitive for developers and aligns with constitution's API-Driven Design principle
- Nested member endpoints clearly express parent-child relationship
- Supports all functional requirements (FR-001 through FR-020)

**Alternatives Considered**:
1. **Flat endpoints for both**: `/teams`, `/team-members` - loses relationship context
2. **GraphQL single endpoint**: Overkill for current requirements, existing CRM uses REST

**API Endpoints**:
```
# Team CRUD
GET    /teams                    # List all teams (with pagination)
GET    /teams/{id}              # Get team by ID
POST   /teams                    # Create team
PUT    /teams/{id}              # Update team
DELETE /teams/{id}              # Delete team (only if no members)

# Team Members
GET    /teams/{id}/members       # Get all members of a team
POST   /teams/{id}/members       # Add member to team
PUT    /teams/{id}/members/{userId}  # Update member role
DELETE /teams/{id}/members/{userId}  # Remove member from team
```

---

### Decision 3: Authorization Model

**Status**: **RESOLVED**

**Question**: How should team management authorization be handled?

**Decision**: Allow all authenticated users to create and manage teams (per FR-018), no new permissions needed.

**Rationale**:
- Spec FR-018 explicitly states "all authenticated users can create and manage teams"
- Aligns with spec assumption that team management is available to all authenticated users
- Simplifies implementation and reduces authorization overhead
- Existing Auth API provides JWT authentication (required per constitution)

**Alternatives Considered**:
1. **Admin-only**: Would require new permission and changes to Auth API, more complex
2. **Team Lead permissions**: Over-engineering for current scope, can be added later
3. **Role-based access**: Would require defining new roles in Auth API

**Security Considerations**:
- All endpoints still require valid JWT token (existing Auth API)
- API key middleware still enforced (existing security layer)
- Audit logging tracks who performs actions (FR-017)
- Input validation prevents malicious data (FluentValidation)

---

### Decision 4: Frontend State Management

**Status**: **RESOLVED**

**Question**: How should team state be managed in the frontend?

**Decision**: Use React Context for team state initially, no Redux integration.

**Rationale**:
- Simpler than Redux for a single feature with moderate state complexity
- Team data is primarily read-only for selectors (deal/customer forms)
- Avoids Redux boilerplate for a feature that may not need complex state management
- Can migrate to Redux if state complexity grows in future iterations

**Alternatives Considered**:
1. **Redux**: Overkill for current requirements, requires boilerplate code
2. **Local component state**: Would require prop drilling, hard to share across components
3. **React Query**: Good for caching but adds dependency, team data is relatively static

**Implementation Approach**:
- Create `TeamContext.jsx` to provide team list and team details
- Use React hooks for form state (team creation/editing)
- Lazy load team data only when needed (on-demand fetching)
- Cache team options in context for dropdown selectors

---

### Decision 5: Team Assignment to Deals/Customers

**Status**: **RESOLVED**

**Question**: How should teams be linked to deals and customers?

**Decision**: Add nullable `sales_team_id` foreign key to `deals` and `customers` tables.

**Rationale**:
- Maintains backward compatibility (nullable field per spec assumption)
- Simple foreign key relationship with proper indexing for performance
- Follows existing pattern of optional associations in CRM
- Supports FR-011, FR-012 (optional team assignment)

**Alternatives Considered**:
1. **Separate junction table**: Overkill for many-to-one relationship (one deal/customer = one team max)
2. **JSON field in existing table**: Breaks relational model, hard to query
3. **Separate entity assignment tables**: Over-engineering for current requirements

**Database Migration**:
```sql
-- Add team_id to crm_deal table
ALTER TABLE crm_deal
ADD COLUMN sales_team_id INT NULL,
ADD CONSTRAINT fk_deals_team
FOREIGN KEY (sales_team_id) REFERENCES crm_sales_teams(id) ON DELETE SET NULL,
ADD INDEX idx_deals_team (sales_team_id);

-- Add team_id to crm_customer table
ALTER TABLE crm_customer
ADD COLUMN sales_team_id INT NULL,
ADD CONSTRAINT fk_customers_team
FOREIGN KEY (sales_team_id) REFERENCES crm_sales_teams(id) ON DELETE SET NULL,
ADD INDEX idx_customers_team (sales_team_id);
```

**Edge Case Handling**:
- Team deletion sets team_id to NULL on linked deals/customers (FR-016)
- Existing deals/customers have NULL team_id (backward compatible)
- Team assignment is optional in forms (as per spec)

---

## Technology Stack Alignment

### Frontend Technology
- **Framework**: React 18+ with Material-UI v5 (existing)
- **State Management**: React Context (TeamContext)
- **Routing**: React Router v6 (existing)
- **API Client**: Axios with interceptors (existing `axiosInstance.js`)
- **Form Validation**: Material-UI validation hooks + custom validation
- **Type Checking**: JavaScript (existing project uses JS, not TypeScript)

**Decision Point**: No major decisions needed. Follows existing patterns.

---

### Backend Technology
- **Framework**: ASP.NET Core 8 Web API (existing)
- **Architecture**: Clean Architecture (existing)
- **ORM**: Dapper with SimpleCRUD (existing)
- **Database**: MySQL 8+ (existing)
- **Validation**: FluentValidation (existing)
- **Logging**: Serilog (existing)
- **Authentication**: Separate Auth API (existing JWT + API key)

**Decision Point**: No major decisions needed. Follows existing patterns.

---

## Performance Considerations

**Status**: **RESOLVED**

**Question**: What performance optimizations are needed?

**Decision**: Implement pagination, caching, and proper indexing.

**Rationale**:
- Pagination prevents loading all teams at once (scalability for 100+ teams)
- Indexing on foreign keys speeds up queries for deal/customer team filtering
- Caching team options in frontend reduces API calls for selectors
- Supports performance goal of <200ms API response time (SC-005)

**Implementation Details**:
1. **Pagination**:
   - Team list endpoint: `GET /teams?page=1&pageSize=50`
   - Default page size: 50 teams
   - Include total count for pagination controls

2. **Database Indexing**:
    - Index on `crm_sales_teams.name` for uniqueness checks and search
    - Index on `crm_team_members.team_id` for fast member lookups
    - Index on `crm_team_members.user_email` for "find user's teams" queries
    - Index on `crm_deal.sales_team_id` for team-based deal filtering
    - Index on `crm_customer.sales_team_id` for team-based customer filtering

3. **Frontend Caching**:
   - Cache team list in `TeamContext` for dropdown selectors
   - Lazy load team details only when viewing/editing specific team
   - Cache team member lists per team to avoid repeated fetches

---

## Integration Points

### Existing CRM Modules
- **Deals**: Add optional team dropdown in create/edit forms
- **Customers**: Add optional team dropdown in create/edit forms
- **User Management**: Need to fetch user list for member assignment autocomplete

### Auth API Integration
- **Authentication**: Use existing JWT authentication (no changes needed)
- **Authorization**: No new permissions required (all authenticated users)
- **User Data**: Need to fetch user list from Auth API or CRM user table

**Decision Point**: Which API provides user list for team member assignment?

**Rationale**: Need to determine where user data lives and how to fetch users for member autocomplete.

**Research Needed**:
- Check if CRM has local user table or relies on Auth API
- Identify existing user autocomplete patterns in CRM (if any)
- Determine API endpoint for user listing

**Assumption (to be verified)**: CRM likely has local user table or endpoint for user management. If not, may need to integrate with Auth API's user endpoint.

---

## Edge Cases & Failure Handling

### Edge Cases (from spec)
1. **Team with members deletion**: Prevent deletion, show error (FR-005, Edge Case 1)
2. **Team deletion with linked deals/customers**: Set team_id to NULL (FR-016, Edge Case 2)
3. **User removed from system**: Retain team member record, mark user as inactive (Edge Case 3)
4. **Invalid user assignment**: Show error that user doesn't exist (FR-020, Edge Case 4)
5. **No team selected**: Allow save with NULL team_id (optional field) (Edge Case 5)

### Failure Handling
- **Validation Errors**: Return 400 with error details (FluentValidation)
- **Team name duplicate**: Return 400 with error message (FR-002)
- **Duplicate member assignment**: Return 400 with error message (FR-008)
- **Team not found**: Return 404
- **Member not found**: Return 404
- **Database connection error**: Return 500 with generic error message, log details

---

## Phase 0 Deliverables

To proceed to Phase 1 (Design & Contracts), all research items are complete:

1. ✅ **Data Model**: Two-table approach confirmed with foreign keys
2. ✅ **API Design**: RESTful CRUD endpoints with nested member endpoints
3. ✅ **Authorization Model**: All authenticated users, no new permissions
4. ✅ **Frontend State Management**: React Context for team state
5. ✅ **Team Assignment Approach**: Nullable foreign keys on deals/customers
6. ✅ **Performance Strategy**: Pagination, indexing, and caching
7. ✅ **User Data Source**: Verified - local `crm_user` table with `/api/users` endpoint

---

## Next Steps

1. **Proceed to Phase 1**: Create data-model.md with entity definitions
2. **Generate API contracts**: Document OpenAPI/Swagger contracts
3. **Create quickstart guide**: Provide setup instructions for developers
4. **Update agent context**: Run agent update script for new technology

---

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| User data source unclear | Medium | Verify user API before Phase 1, use existing patterns |
| Team deletion cascading issues | Medium | Use ON DELETE SET NULL for foreign keys, validate before deletion |
| Performance degradation with many teams | Low | Implement pagination and indexing from start |
| Authorization model may need refinement | Low | Spec explicitly allows all users, can add permissions later if needed |

---

## Conclusion

All major technical decisions have been resolved for the sales team management feature. The feature will use a two-table data model, RESTful API endpoints, React Context for state management, and nullable foreign keys for optional team assignment.

User data source verification complete: CRM has local `crm_user` table with `/api/users` endpoint that can be used for team member autocomplete without modifications.

**Status**: Research complete. Ready to proceed to Phase 1 (Design & Contracts).
