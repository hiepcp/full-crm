# Data Model: Sales Team Management

**Feature**: Sales Team Management
**Branch**: 002-sales-team-management
**Date**: 2025-12-30

## Overview

This document defines the data model for the sales team management feature, including entities, attributes, relationships, validation rules, and database schema.

## Entities

### SalesTeam

Represents a sales team in the CRM system. Teams are organizational units used to group users and assign ownership of deals and customers.

**Attributes**:

| Attribute | Type | Description | Validation | Nullable |
|-----------|------|-------------|-------------|----------|
| Id | long | Primary key | Auto-incremented | No |
| Name | string | Team name (must be unique) | Required, max 255 chars, unique | No |
| Description | string | Team description | Max 2000 chars | Yes |
| CreatedByEmail | string | User email who created the team | Required, foreign key to crm_user.email | No |
| CreatedAt | DateTime | Timestamp when team was created | Auto-set | No |
| UpdatedByEmail | string | User email who last updated the team | Foreign key to crm_user.email | Yes |
| UpdatedAt | DateTime | Timestamp when team was last updated | Auto-set | Yes |

**Validation Rules**:
- Name must be unique across all teams (case-insensitive)
- Name cannot be empty or whitespace only
- Description can be empty but if provided, must be 1-2000 characters
- CreatedBy must reference an existing active user

**Relationships**:
- One-to-many with TeamMember (a team has many members)
- One-to-many with Deal (a team can be assigned to many deals, optional)
- One-to-many with Customer (a team can be assigned to many customers, optional)
- Many-to-one with User (via CreatedBy and UpdatedBy)

---

### TeamMember

Represents a user's membership in a sales team. Each membership includes a role defining the user's responsibilities within the team.

**Attributes**:

| Attribute | Type | Description | Validation | Nullable |
|-----------|------|-------------|-------------|----------|
| Id | long | Primary key | Auto-incremented | No |
| TeamId | long | Team ID this member belongs to | Required, foreign key to sales_teams.id | No |
| UserEmail | string | User email who is the team member | Required, foreign key to crm_user.email | No |
| Role | enum | Member's role in the team | Required, values: TeamLead, Member, Observer | No |
| JoinedAt | DateTime | Timestamp when user joined the team | Auto-set | No |

**Validation Rules**:
- TeamId must reference an existing team
- UserId must reference an existing active user
- Role must be one of: TeamLead, Member, Observer
- Unique constraint on (TeamId, UserId) - a user cannot be added to the same team twice
- A user can belong to multiple different teams (FR-019)

**Relationships**:
- Many-to-one with SalesTeam (belongs to team)
- Many-to-one with User (belongs to user)

---

## Enumerations

### TeamRole

Defines the possible roles a user can have within a team.

| Value | Description | Permissions |
|-------|-------------|--------------|
| TeamLead | Team leader role | Can manage team members, represents the team's leadership |
| Member | Standard team member | Participates in team activities, no management privileges |
| Observer | Read-only team member | Can view team information but cannot make changes |

**Default Role**: Member (when adding users to teams without specifying role)

---

## Database Schema

### Table: crm_sales_teams

```sql
CREATE TABLE crm_sales_teams (
  id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  CreatedBy VARCHAR(255) NOT NULL,
  CreatedOn DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UpdatedBy VARCHAR(255),
  UpdatedOn DATETIME ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_teams_name (name),
  INDEX idx_teams_CreatedBy (CreatedBy),
  UNIQUE KEY uk_teams_name (name),
  CONSTRAINT fk_teams_CreatedBy
    FOREIGN KEY (CreatedBy) REFERENCES crm_user(email) ON DELETE RESTRICT,
  CONSTRAINT fk_teams_UpdatedBy
    FOREIGN KEY (UpdatedBy) REFERENCES crm_user(email) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Table: crm_team_members

```sql
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

  INDEX idx_members_team (team_id),
  INDEX idx_members_user (user_email),
  UNIQUE KEY uk_members_team_user (team_id, user_email),
  CONSTRAINT fk_members_team
    FOREIGN KEY (team_id) REFERENCES crm_sales_teams(id) ON DELETE CASCADE,
  CONSTRAINT fk_members_user
    FOREIGN KEY (user_email) REFERENCES crm_user(email) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## Database Migrations

### Migration 1: Add Team Foreign Keys to Existing Tables

To support optional team assignment to deals and customers, add nullable foreign keys to existing tables.

```sql
-- Add sales_team_id to crm_deal table
ALTER TABLE crm_deal
ADD COLUMN sales_team_id BIGINT NULL,
ADD INDEX idx_deals_team (sales_team_id),
ADD CONSTRAINT fk_deals_team
FOREIGN KEY (sales_team_id) REFERENCES crm_sales_teams(id) ON DELETE SET NULL;

-- Add sales_team_id to crm_customer table
ALTER TABLE crm_customer
ADD COLUMN sales_team_id BIGINT NULL,
ADD INDEX idx_customers_team (sales_team_id),
ADD CONSTRAINT fk_customers_team
FOREIGN KEY (sales_team_id) REFERENCES crm_sales_teams(id) ON DELETE SET NULL;
```

**Migration Notes**:
- Existing deals and customers will have `sales_team_id = NULL` (backward compatible)
- ON DELETE SET NULL ensures team deletion doesn't break deal/customer records (FR-016)
- Indexes added for performance when filtering by team

---

## Relationships Diagram

```
┌──────────────┐
│  crm_user    │
└──────┬───────┘
        │
        │ 1
        │
        ▼
┌──────────────┐         1:N        ┌──────────────┐
│crm_sales_teams│◄───────────────┤crm_team_members│
└──────┬───────┘                    └──────┬───────┘
        │                                    │
        │ 1                                  │ 1
        │                                    │
        │ 0..N                              │ N..1
        ▼                                    ▼
┌──────────────┐                    ┌──────────────┐
│  crm_deal    │                    │  crm_user    │
│ (optional)   │                    └──────────────┘
└──────────────┘
        │
        │ 0..N
        ▼
┌──────────────┐
│crm_customer  │
│ (optional)   │
└──────────────┘
```

**Relationship Details**:
- **crm_sales_teams → crm_team_members**: One-to-many (a team has many members)
- **crm_team_members → crm_user**: Many-to-one (a user can be in many teams, but has one membership record per team, linked by email)
- **crm_sales_teams → crm_deal**: One-to-many, optional (a team can be assigned to many deals)
- **crm_sales_teams → crm_customer**: One-to-many, optional (a team can be assigned to many customers)
- **crm_user → crm_sales_teams**: Many-to-many, through crm_team_members (a user can be in many teams)
- **crm_user → crm_sales_teams** (via CreatedBy/UpdatedBy): Many-to-one (users create/update teams)

---

## Validation Rules Summary

### SalesTeam

| Rule | Implementation |
|------|----------------|
| Name required | Database NOT NULL constraint |
| Name unique | Database UNIQUE constraint |
| Name max 255 chars | Database VARCHAR(255) |
| Description max 2000 chars | Application-level validation |
| CreatedBy valid user | Foreign key constraint |
| UpdatedBy valid user | Foreign key constraint |

### TeamMember

| Rule | Implementation |
|------|----------------|
| TeamId required | Database NOT NULL constraint |
| UserEmail required | Database NOT NULL constraint |
| Role required | Database NOT NULL constraint, ENUM type |
| Role valid values | Database ENUM ('TeamLead', 'Member', 'Observer') |
| Unique team membership | Database UNIQUE (team_id, user_email) |
| User not in same team twice | Database UNIQUE constraint |
| Team exists | Foreign key constraint (ON DELETE CASCADE) |
| User exists | Foreign key constraint (ON DELETE CASCADE) |

---

## State Transitions

### SalesTeam Lifecycle

1. **Created**: Team created with initial name and description
2. **Updated**: Team name or description modified
3. **Deleted**: Team deleted (only allowed if no members exist, FR-005)

**Constraints**:
- Cannot delete team if it has members (prevent cascade deletion, FR-005)
- Team deletion sets sales_team_id to NULL on related deals/customers (FR-016)

### TeamMember Lifecycle

1. **Added**: User added to team with a role
2. **Updated**: User's role changed within team
3. **Removed**: User removed from team

**Constraints**:
- Cannot add same user to same team twice (unique constraint)
- Removing user from team doesn't delete the user record
- Deleting team cascades to delete all team members (ON DELETE CASCADE)

---

## Indexing Strategy

### Performance Considerations

**Indexes Created**:

| Table | Index | Purpose |
|-------|--------|---------|
| crm_sales_teams | PRIMARY KEY (id) | Primary key, unique identification |
| crm_sales_teams | uk_teams_name (name) | Unique name lookup, validation |
| crm_sales_teams | idx_teams_CreatedBy (CreatedBy) | Query teams by creator |
| crm_team_members | PRIMARY KEY (id) | Primary key |
| crm_team_members | uk_members_team_user (team_id, user_email) | Unique membership lookup |
| crm_team_members | idx_members_team (team_id) | Query members by team |
| crm_team_members | idx_members_user (user_email) | Query teams by user |
| crm_deal | idx_deals_team (sales_team_id) | Filter deals by team |
| crm_customer | idx_customers_team (sales_team_id) | Filter customers by team |

**Query Optimization**:
- Team name lookup: Uses `uk_teams_name` for uniqueness validation
- Team member list: Uses `idx_members_team` to fetch all members of a team
- User's teams: Uses `idx_members_user` to find all teams a user belongs to
- Team deals: Uses `idx_deals_team` for filtering deals by team
- Team customers: Uses `idx_customers_team` for filtering customers by team

---

## Data Integrity

### Referential Integrity

- **Foreign Keys**: All foreign keys are enforced by database
- **Cascade Rules**:
  - crm_team_members → crm_sales_teams: ON DELETE CASCADE (members deleted when team deleted)
  - crm_team_members → crm_user: ON DELETE CASCADE (membership deleted when user deleted)
  - crm_deal → crm_sales_teams: ON DELETE SET NULL (team assignment cleared when team deleted)
  - crm_customer → crm_sales_teams: ON DELETE SET NULL (team assignment cleared when team deleted)
- crm_sales_teams → crm_user (CreatedBy): ON DELETE RESTRICT (cannot delete user who created teams)
- crm_sales_teams → crm_user (UpdatedBy): ON DELETE SET NULL (nullified when user deleted)

### Business Rules

1. **Team Name Uniqueness** (FR-002): Enforced by database unique constraint
2. **Duplicate Membership Prevention** (FR-008): Enforced by unique constraint on (team_id, user_email)
3. **Team Deletion Constraint** (FR-005): Application-level validation before deletion
4. **Optional Team Assignment** (FR-011, FR-012): Nullable foreign keys on crm_deal/crm_customer

---

## Example Data

### SalesTeam Records

| id | name | description | CreatedBy | CreatedOn | UpdatedBy | UpdatedOn |
|-----|------|-------------|------------|------------|------------|------------|
| 1 | Enterprise Sales | Handles enterprise client deals | manager@crm.local | 2025-01-15 09:00:00 | manager@crm.local | 2025-01-15 09:00:00 |
| 2 | SMB Sales | Focus on small and medium businesses | lead@crm.local | 2025-01-20 14:30:00 | director@crm.local | 2025-01-25 11:15:00 |
| 3 | Northeast Region | Northeast US sales territory | admin@crm.local | 2025-02-01 08:45:00 | NULL | NULL |

### TeamMember Records

| id | team_id | user_email | role | joined_at | CreatedBy | CreatedOn | UpdatedBy | UpdatedOn |
|-----|---------|------------|------|-----------|------------|------------|------------|------------|
| 1 | 1 | alice@crm.local | TeamLead | 2025-01-15 09:05:00 | manager@crm.local | 2025-01-15 09:05:00 | NULL | NULL |
| 2 | 1 | bob@crm.local | Member | 2025-01-16 10:20:00 | manager@crm.local | 2025-01-16 10:20:00 | NULL | NULL |
| 3 | 1 | chris@crm.local | Member | 2025-01-17 11:30:00 | manager@crm.local | 2025-01-17 11:30:00 | NULL | NULL |
| 4 | 2 | dana@crm.local | TeamLead | 2025-01-20 14:45:00 | lead@crm.local | 2025-01-20 14:45:00 | director@crm.local | 2025-01-25 11:15:00 |
| 5 | 2 | eli@crm.local | Member | 2025-01-21 09:10:00 | lead@crm.local | 2025-01-21 09:10:00 | NULL | NULL |
| 6 | 3 | alice@crm.local | Observer | 2025-02-01 09:00:00 | admin@crm.local | 2025-02-01 09:00:00 | NULL | NULL |

---

## Next Steps

1. **Generate API Contracts**: Define REST API endpoints and request/response DTOs
2. **Create Quickstart Guide**: Provide setup instructions for developers
3. **Update Agent Context**: Document new entities and relationships for AI agents
