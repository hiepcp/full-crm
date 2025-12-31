# Quickstart Guide: Sales Team Management

**Feature**: Sales Team Management
**Branch**: 002-sales-team-management
**Date**: 2025-12-30

## Overview

This guide provides step-by-step instructions for setting up and implementing the sales team management feature in the CRM system.

## Prerequisites

### Backend Prerequisites

- **.NET 8 SDK** installed
- **MySQL 8+** database running
- **mkcert** for local SSL certificates
- **Access to**:
  - `crm-system` backend codebase
  - `res-auth-api` for authentication (no changes needed)

### Frontend Prerequisites

- **Node.js 18+** installed
- **npm** package manager
- **React 18+** project structure
- **Material-UI (MUI)** v5+
- **Access to**:
  - `crm-system-client` frontend codebase

### Development Environment

- Local HTTPS setup with `crm.local.com` and `api-crm.local.com`
- Auth API running at `https://api-auth.local.com`
- MySQL database connection configured in `appsettings.json`

---

## Backend Implementation Steps

### Step 1: Create Domain Entities

**Location**: `crm-system/src/CRM.Domain/Entities/`

**File**: `SalesTeam.cs`

```csharp
using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("crm_sales_teams")]
    public class SalesTeam : BaseEntity
    {
        public long Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
```

**File**: `TeamMember.cs`

```csharp
using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("crm_team_members")]
    public class TeamMember : BaseEntity
    {
        public long Id { get; set; }

        public long TeamId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public TeamRole Role { get; set; }
    }
}

public enum TeamRole
{
    TeamLead,
    Member,
    Observer
}
```

---

### Step 2: Create Request/Response DTOs

**Location**: `crm-system/src/CRM.Application/Dtos/Teams/`

**Files to create**:
- `CreateTeamRequest.cs`
- `UpdateTeamRequest.cs`
- `TeamResponse.cs`
- `TeamMemberRequest.cs`
- `TeamMemberResponse.cs`
- `QueryTeamsRequest.cs`
- `UserReference.cs`

See `contracts/api-contracts.md` for full DTO definitions.

---

### Step 3: Create Validators

**Location**: `crm-system/src/CRM.Application/Validators/`

**File**: `CreateTeamRequestValidator.cs`

```csharp
using FluentValidation;
using CRMSys.Application.Dtos.Teams;

namespace CRMSys.Application.Validators
{
    public class CreateTeamRequestValidator : AbstractValidator<CreateTeamRequest>
    {
        public CreateTeamRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty().WithMessage("Team name is required")
                .MaximumLength(255).WithMessage("Team name must be 255 characters or less")
                .MustAsync(BeUniqueTeamNameAsync).WithMessage("Team name must be unique");
        }

        private async Task<bool> BeUniqueTeamNameAsync(string name, CancellationToken ct)
        {
            // Implement uniqueness check via repository
            return await _salesTeamRepository.IsNameUniqueAsync(name, ct);
        }
    }
}
```

**File**: `TeamMemberRequestValidator.cs`

```csharp
using FluentValidation;
using CRMSys.Application.Dtos.Teams;

namespace CRMSys.Application.Validators
{
    public class TeamMemberRequestValidator : AbstractValidator<TeamMemberRequest>
    {
        public TeamMemberRequestValidator()
        {
            RuleFor(x => x.UserId)
                .NotEmpty().WithMessage("User ID is required")
                .MustAsync(ValidUserAsync).WithMessage("User not found");

            RuleFor(x => x.Role)
                .IsInEnum().WithMessage("Invalid role");
        }
    }
}
```

---

### Step 4: Create Service Interface

**Location**: `crm-system/src/CRM.Application/Interfaces/`

**File**: `ISalesTeamService.cs`

```csharp
using CRMSys.Application.Dtos.Teams;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface ISalesTeamService
    {
        Task<PagedResult<TeamResponse>> QueryAsync(QueryTeamsRequest query, CancellationToken ct = default);
        Task<TeamResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreateTeamRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateTeamRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);

        // Team members
        Task<PagedResult<TeamMemberResponse>> GetTeamMembersAsync(long teamId, TeamMemberQueryRequest query, CancellationToken ct = default);
        Task<TeamMemberResponse?> AddMemberAsync(long teamId, TeamMemberRequest request, CancellationToken ct = default);
        Task<bool> UpdateMemberRoleAsync(long teamId, long userId, UpdateTeamMemberRequest request, CancellationToken ct = default);
        Task<bool> RemoveMemberAsync(long teamId, long userId, CancellationToken ct = default);
    }
}
```

---

### Step 5: Create Service Implementation

**Location**: `crm-system/src/CRM.Application/Services/`

**File**: `SalesTeamService.cs`

Implement `ISalesTeamService` with business logic:
- Validate team name uniqueness
- Prevent team deletion with members (FR-005)
- Prevent duplicate team member assignments (FR-008)
- Log all operations (FR-017)
- Handle cascading team deletion for deals/customers (FR-016)

---

### Step 6: Create Repository Interface

**Location**: `crm-system/src/CRM.Infrastructure/Repositories/`

**File**: `ISalesTeamRepository.cs`

```csharp
using CRMSys.Domain.Entities;
using CRMSys.Application.Dtos.Teams;
using Shared.Dapper.Models;

namespace CRMSys.Infrastructure.Repositories
{
    public interface ISalesTeamRepository : IRepository<SalesTeam, long>
    {
        Task<bool> IsNameUniqueAsync(string name, CancellationToken ct = default);
        Task<int> GetMemberCountAsync(long teamId, CancellationToken ct = default);
        Task<PagedResult<TeamMember>> GetTeamMembersAsync(long teamId, TeamMemberQueryRequest query, CancellationToken ct = default);
        Task<TeamMember?> GetTeamMemberAsync(long teamId, long userId, CancellationToken ct = default);
    }
}
```

---

### Step 7: Create Repository Implementation

**Location**: `crm-system/src/CRM.Infrastructure/Repositories/`

**File**: `SalesTeamRepository.cs`

Implement `ISalesTeamRepository` using Dapper:
- CRUD operations for `SalesTeam` and `TeamMember` entities
- Unique name validation
- Member counting for deletion validation
- Pagination support

---

### Step 8: Create SQL Queries

**Location**: `crm-system/src/CRM.Infrastructure/Sqls/Teams/`

**Files to create**:
- `CreateTeam.sql`
- `UpdateTeam.sql`
- `DeleteTeam.sql`
- `QueryTeams.sql`
- `AddTeamMember.sql`
- `UpdateTeamMemberRole.sql`
- `RemoveTeamMember.sql`
- `QueryTeamMembers.sql`
- `GetMemberCount.sql`

Example SQL:
```sql
-- CreateTeam.sql
INSERT INTO crm_sales_teams (name, description, CreatedBy, CreatedOn, UpdatedBy, UpdatedOn)
VALUES (@Name, @Description, @CreatedBy, NOW(), @UpdatedBy, NOW());
SELECT LAST_INSERT_ID();
```

---

### Step 9: Create API Controller

**Location**: `crm-system/src/CRM.Api/Controllers/`

**File**: `SalesTeamsController.cs`

Implement all endpoints defined in `contracts/api-contracts.md`:
- `GET /api/teams` - List teams
- `GET /api/teams/{id}` - Get team by ID
- `POST /api/teams` - Create team
- `PUT /api/teams/{id}` - Update team
- `DELETE /api/teams/{id}` - Delete team
- `GET /api/teams/{id}/members` - List team members
- `POST /api/teams/{id}/members` - Add team member
- `PUT /api/teams/{id}/members/{userId}` - Update member role
- `DELETE /api/teams/{id}/members/{userId}` - Remove team member

---

### Step 10: Register Services

**Location**: `crm-system/src/CRM.Application/DependencyInjection.cs`

```csharp
services.AddScoped<ISalesTeamService, SalesTeamService>();
services.AddScoped<ISalesTeamRepository, SalesTeamRepository>();
services.AddScoped<CreateTeamRequestValidator>();
services.AddScoped<TeamMemberRequestValidator>();
```

**Location**: `crm-system/src/CRM.Infrastructure/DependencyInjection.cs`

```csharp
services.AddScoped<ISalesTeamRepository, SalesTeamRepository>();
```

---

### Step 11: Run Database Migration

Execute SQL to create new tables and add foreign keys:

```sql
-- See data-model.md for full migration script
CREATE TABLE crm_sales_teams (...);
CREATE TABLE crm_team_members (...);
ALTER TABLE crm_deal ADD COLUMN sales_team_id ...;
ALTER TABLE crm_customer ADD COLUMN sales_team_id ...;
```

---

## Frontend Implementation Steps

### Step 1: Create API Client

**Location**: `crm-system-client/src/infrastructure/api/`

**File**: `teamsApi.js`

```javascript
import axiosInstance from './axiosInstance';

export const teamsApi = {
  // Team CRUD
  getTeams: (params) => axiosInstance.get('/teams', { params }),
  getTeam: (id) => axiosInstance.get(`/teams/${id}`),
  createTeam: (data) => axiosInstance.post('/teams', data),
  updateTeam: (id, data) => axiosInstance.put(`/teams/${id}`, data),
  deleteTeam: (id) => axiosInstance.delete(`/teams/${id}`),

  // Team members
  getTeamMembers: (teamId, params) => axiosInstance.get(`/teams/${teamId}/members`, { params }),
  addTeamMember: (teamId, data) => axiosInstance.post(`/teams/${teamId}/members`, data),
  updateTeamMemberRole: (teamId, userId, data) => axiosInstance.put(`/teams/${teamId}/members/${userId}`, data),
  removeTeamMember: (teamId, userId) => axiosInstance.delete(`/teams/${teamId}/members/${userId}`),
};

export default teamsApi;
```

---

### Step 2: Create Team Context

**Location**: `crm-system-client/src/app/contexts/`

**File**: `TeamContext.jsx`

```javascript
import React, { createContext, useContext, useState, useCallback } from 'react';
import { teamsApi } from '../../infrastructure/api/teamsApi';

const TeamContext = createContext();

export const useTeams = () => {
  const context = useContext(TeamContext);
  if (!context) throw new Error('useTeams must be used within TeamProvider');
  return context;
};

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchTeams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await teamsApi.getTeams();
      setTeams(response.data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <TeamContext.Provider value={{ teams, loading, error, fetchTeams }}>
      {children}
    </TeamContext.Provider>
  );
};
```

---

### Step 3: Add Team Routes

**Location**: `crm-system-client/src/app/routes/MainRoutes.jsx`

```javascript
import TeamList from '../../presentation/pages/teams/TeamList';
import TeamForm from '../../presentation/pages/teams/TeamForm';
import TeamMembers from '../../presentation/pages/teams/TeamMembers';

// Add routes
<Route path="/teams" element={<TeamList />} />
<Route path="/teams/new" element={<TeamForm />} />
<Route path="/teams/:id/edit" element={<TeamForm />} />
<Route path="/teams/:id/members" element={<TeamMembers />} />
```

---

### Step 4: Create Team List Page

**Location**: `crm-system-client/src/presentation/pages/teams/`

**File**: `TeamList.jsx`

Implement team list with:
- DataGrid displaying team name, member count, created date
- Pagination support
- Search/filter by team name
- Create team button
- Edit/Delete actions for each team
- Material-UI components

---

### Step 5: Create Team Form

**Location**: `crm-system-client/src/presentation/pages/teams/`

**File**: `TeamForm.jsx`

Implement team create/edit form with:
- Team name input (required, max 255 chars)
- Description textarea (optional, max 2000 chars)
- Save and Cancel buttons
- Validation for unique team name
- Material-UI TextField components

---

### Step 6: Create Team Members Page

**Location**: `crm-system-client/src/presentation/pages/teams/`

**File**: `TeamMembers.jsx`

Implement team member management with:
- Member list with user details and role
- Add member button with user autocomplete
- Role dropdown for each member
- Remove member action
- Material-UI DataGrid and Autocomplete

---

### Step 7: Create Team Selector Component

**Location**: `crm-system-client/src/presentation/components/teams/`

**File**: `TeamSelector.jsx`

```javascript
import { Autocomplete, TextField } from '@mui/material';
import { useTeams } from '../../../app/contexts/TeamContext';

const TeamSelector = ({ value, onChange, ...props }) => {
  const { teams, loading } = useTeams();

  return (
    <Autocomplete
      options={teams}
      getOptionLabel={(option) => option.name}
      value={value}
      onChange={(event, newValue) => onChange(newValue)}
      loading={loading}
      renderInput={(params) => (
        <TextField {...params} label="Team" placeholder="Select team" />
      )}
      {...props}
    />
  );
};

export default TeamSelector;
```

---

### Step 8: Add Team Assignment to Deal Form

**Location**: `crm-system-client/src/presentation/pages/deals/`

**File**: `DealForm.jsx`

```javascript
import TeamSelector from '../../components/teams/TeamSelector';

// Add to form
<Grid item xs={12}>
  <TeamSelector
    value={formData.team}
    onChange={(team) => setFormData({ ...formData, sales_team_id: team?.id })}
    helperText="Optional: Assign team to this deal"
  />
</Grid>
```

---

### Step 9: Add Team Assignment to Customer Form

**Location**: `crm-system-client/src/presentation/pages/customers/`

**File**: `CustomerForm.jsx`

Same as DealForm - add TeamSelector component.

---

### Step 10: Display Team on Deal/Customer Detail Pages

**Location**: `crm-system-client/src/presentation/pages/deals/` and `/customers/`

Add team display section showing:
- Assigned team name
- Team members list
- Team member roles

---

### Step 11: Add Constants

**Location**: `crm-system-client/src/utils/constants.js`

```javascript
export const TEAM_ROLES = [
  { value: 'TeamLead', label: 'Team Lead' },
  { value: 'Member', label: 'Member' },
  { value: 'Observer', label: 'Observer' },
];
```

---

## Testing

### Backend Testing

Run tests from test project directory:
```bash
cd crm-system/tests/CRMApi.UnitTests
dotnet test
```

### Frontend Testing

Run development server:
```bash
cd crm-system-client
npm run dev
```

Access at: `https://crm.local.com:3000`

---

## Verification Checklist

### Backend

- [ ] Domain entities created (`SalesTeam`, `TeamMember`)
- [ ] DTOs created for all requests/responses
- [ ] Validators implemented for all request DTOs
- [ ] Service interface and implementation created
- [ ] Repository interface and implementation created
- [ ] SQL queries created in `Infrastructure/Sqls/Teams/`
- [ ] Controller created with all 9 endpoints
- [ ] Services registered in `DependencyInjection.cs`
- [ ] Database migration executed successfully
- [ ] API accessible at `/api/teams`
- [ ] Swagger documentation generated

### Frontend

- [ ] API client created (`teamsApi.js`)
- [ ] Team context created (`TeamContext.jsx`)
- [ ] Routes added for team pages
- [ ] Team list page implemented
- [ ] Team form (create/edit) implemented
- [ ] Team members page implemented
- [ ] Team selector component created
- [ ] Team selector added to deal form
- [ ] Team selector added to customer form
- [ ] Team display added to deal detail page
- [ ] Team display added to customer detail page
- [ ] Team role constants added

### Integration

- [ ] Can create team through UI
- [ ] Can edit team name/description
- [ ] Can delete empty team
- [ ] Cannot delete team with members
- [ ] Can add users to teams
- [ ] Can update team member roles
- [ ] Can remove users from teams
- [ ] Can assign teams to deals
- [ ] Can assign teams to customers
- [ ] Team displays on deal/customer details
- [ ] Team deletion sets team_id to NULL on deals/customers

---

## Troubleshooting

### Backend Issues

**Team name not unique error**:
- Check if team name already exists in database
- Ensure case-insensitive comparison

**Cannot delete team error**:
- Verify team has no members
- Remove all members before deleting team

**User not found error**:
- Verify user exists in `crm_user` table
- Check user is active (`is_active = 1`)

### Frontend Issues

**Teams not loading**:
- Check `TeamProvider` wraps your component
- Verify API endpoint is accessible
- Check browser console for errors

**Team selector not appearing**:
- Ensure `TeamSelector` component is imported correctly
- Check Material-UI Autocomplete is installed
- Verify teams are loaded from API

**Team assignment not saving**:
- Check form data includes `sales_team_id`
- Verify deal/customer forms include TeamSelector component
- Check API response for errors

---

## Next Steps

1. **Implement Backend**: Follow backend implementation steps
2. **Implement Frontend**: Follow frontend implementation steps
3. **Test End-to-End**: Create test team, add members, assign to deals/customers
4. **Verify Edge Cases**: Test team deletion, duplicate members, etc.
5. **Run Integration Tests**: Ensure all scenarios from spec work correctly

---

## Additional Resources

- **Data Model**: [data-model.md](data-model.md)
- **API Contracts**: [contracts/api-contracts.md](api-contracts.md)
- **Feature Spec**: [spec.md](spec.md)
- **Research**: [research.md](research.md)
- **Constitution**: [.specify/memory/constitution.md](../../.specify/memory/constitution.md)
- **Project README**: [CLAUDE.md](../../CLAUDE.md)
