# Research & Design Decisions: Add Contract Activity Type

**Feature**: 005-contract-activity
**Date**: 2025-12-24
**Status**: Complete

## Overview

This document captures the research findings and design decisions for adding "contract" as a new activity type to the CRM system. Since this is a straightforward extension of an existing, well-established pattern, minimal research was required.

## Technical Decisions

### Decision 1: Database Schema Approach

**Decision**: Alter existing `crm_activity` table ENUM to include 'contract' value

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Alter ENUM | Modify ActivityType ENUM to add 'contract' | ✅ Consistent with existing pattern<br>✅ No migration logic needed<br>✅ Type-safe at DB level | ⚠️ Requires coordinated deployment | ✅ **SELECTED** |
| B. VARCHAR + validation | Change ActivityType to VARCHAR, validate in code | ✅ More flexible for future types | ❌ Loses DB-level type safety<br>❌ Breaking change to schema<br>❌ Not backward compatible | ❌ Rejected |
| C. Activity subtype table | Create contract_activities table | ❌ Over-engineering<br>❌ Violates existing pattern<br>❌ Complex queries | None | ❌ Rejected |

**Rationale**: Option A follows the existing pattern established for the 5 current activity types (email, call, meeting, task, note). MySQL ENUM alteration is straightforward and maintains type safety. The coordinated deployment requirement is acceptable as this is standard practice for schema changes.

**Implementation Details**:
```sql
-- Current ENUM
ActivityType ENUM('email','call','meeting','task','note') NOT NULL DEFAULT 'note'

-- Updated ENUM
ActivityType ENUM('email','call','meeting','task','note','contract') NOT NULL DEFAULT 'note'
```

**References**:
- Existing schema: `crm-system/src/CRM.Infrastructure/Sqls/reset_database.sql:449`
- MySQL ENUM documentation: https://dev.mysql.com/doc/refman/8.0/en/enum.html

---

### Decision 2: Icon and Color Scheme

**Decision**: Use 📄 (document icon) with Material-UI secondary/purple color scheme

**Options Considered**:

| Option | Icon | Color | Pros | Cons | Verdict |
|--------|------|-------|------|------|---------|
| A. Document icon | 📄 | Purple/Secondary | ✅ Semantically correct<br>✅ Not used by other types<br>✅ Aligns with MUI theme | None | ✅ **SELECTED** |
| B. Handshake icon | 🤝 | Blue | ✅ Represents contracts | ❌ Similar to "Referral" icon<br>❌ Blue already used (Meeting) | ❌ Rejected |
| C. Pen icon | ✍️ | Green | ✅ Signing contracts | ❌ Less clear meaning<br>❌ Green used (Email) | ❌ Rejected |

**Rationale**: The document icon (📄) clearly represents contracts and legal documents. Purple/secondary color is available in the Material-UI theme and not currently used by other activity types. This ensures visual distinction without conflicts.

**Current Activity Type Colors** (for reference):
- Email: Green (`theme.palette.success.main`)
- Call: Orange (`theme.palette.warning.main`)
- Meeting: Blue (`theme.palette.info.main`)
- Task: Primary Blue (`theme.palette.primary.main`)
- Note: Default/Grey

**Implementation**:
```javascript
// In ActivityFeed.jsx iconConfig switch
case ACTIVITY_CATEGORIES.CONTRACT:
  return {
    icon: <DescriptionIcon fontSize="small" />, // MUI document icon
    bg: theme.palette.secondary.lighter,
    color: theme.palette.secondary.main
  };
```

**References**:
- Existing icon logic: `crm-system-client/src/presentation/components/common/ActivityFeed/ActivityFeed.jsx:209-219`
- MUI Icons: https://mui.com/material-ui/material-icons/

---

### Decision 3: Frontend Constant Structure

**Decision**: Add to both `ACTIVITY_TYPES` (for forms) and `ACTIVITY_CATEGORIES` (for filtering)

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Two constants | Add to both ACTIVITY_TYPES and ACTIVITY_CATEGORIES | ✅ Follows existing pattern<br>✅ Supports both form creation and filtering | None | ✅ **SELECTED** |
| B. Single constant | Use one constant for both purposes | ❌ Breaks existing pattern<br>❌ Requires refactoring all usages | None | ❌ Rejected |

**Rationale**: The codebase currently uses two separate constants:
- `ACTIVITY_TYPES`: Array of objects with `value` and `label` for dropdown forms (includes emojis like "📄 Contract")
- `ACTIVITY_CATEGORIES`: Object with keys for filtering logic (simple string values like "contract")

This separation allows frontend components to display user-friendly labels in forms while using clean string values for filtering/categorization logic.

**Implementation**:
```javascript
// In constants.js
export const ACTIVITY_TYPES = [
  { value: 'email', label: '📧 Email' },
  { value: 'meeting-online', label: '📹 Online Appointment' },
  { value: 'meeting-offline', label: '📅 Offline Appointment' },
  { value: 'call', label: '📞 Call' },
  { value: 'note', label: '📝 Note' },
  { value: 'contract', label: '📄 Contract' }  // NEW
];

export const ACTIVITY_CATEGORIES = {
  EMAIL: 'email',
  CALL: 'call',
  MEETING: 'meeting',
  NOTE: 'note',
  CONTRACT: 'contract'  // NEW
};
```

**References**:
- Existing constants: `crm-system-client/src/utils/constants.js:90-110`

---

### Decision 4: Backend DTO Computed Properties

**Decision**: Add `IsContract` computed property to both Activity entity and ActivityResponse DTO

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Both entity and DTO | Add to Activity.cs and ActivityResponse.cs | ✅ Consistent with existing pattern<br>✅ Enables filtering at both layers | ⚠️ Minor duplication | ✅ **SELECTED** |
| B. DTO only | Add only to ActivityResponse.cs | ✅ Less duplication | ❌ Breaks pattern (all other types have both)<br>❌ Can't filter in repository layer | ❌ Rejected |

**Rationale**: The existing codebase has computed properties like `IsEmail`, `IsCall`, `IsMeeting`, `IsTask`, `IsNote` in both the domain entity (Activity.cs) and the response DTO (ActivityResponse.cs). This pattern enables:
- Domain-level business logic using type checks (if needed in future)
- API response consumers to easily identify activity types without string comparison
- Consistency across all activity types

**Implementation**:
```csharp
// In Activity.cs (Domain)
[NotMapped]
public bool IsContract => ActivityType == "contract";

// In ActivityResponse.cs (Application DTO)
public bool IsContract => ActivityType == "contract";
```

**References**:
- Domain entity: `crm-system/src/CRM.Domain/Entities/Activity.cs:42-51`
- Response DTO: `crm-system/src/CRM.Application/Dtos/Response/ActivityResponse.cs:41-45`

---

### Decision 5: Deployment Strategy

**Decision**: Coordinated single deployment across database, backend, and frontend

**Options Considered**:

| Option | Description | Pros | Cons | Verdict |
|--------|-------------|------|------|---------|
| A. Coordinated deployment | Deploy all layers together | ✅ Ensures consistency<br>✅ No interim broken state | ⚠️ Requires deployment coordination | ✅ **SELECTED** |
| B. Phased deployment | Deploy DB first, then backend, then frontend | ❌ Interim broken states<br>❌ DB ENUM change not backward compatible | None | ❌ Rejected |

**Rationale**: MySQL ENUM alteration is not backward compatible - once the database accepts 'contract' values, the backend must be able to handle them. The deployment must be coordinated:

1. **Backend + Database**: Deploy together (backend deploys new SQL schema script)
2. **Frontend**: Deploy immediately after (can be seconds later, existing activity types still work)

**Deployment Checklist**:
- [ ] Run database migration script (ALTER TABLE to add 'contract' to ENUM)
- [ ] Deploy backend API with updated Activity entity and ActivityResponse DTO
- [ ] Deploy frontend with updated constants and ActivityFeed component
- [ ] Verify contract activity creation in UI
- [ ] Verify contract activity filtering works
- [ ] Verify existing activity types still work correctly

**References**:
- Constraint C-002 in spec.md: "Database schema change requires coordinated deployment"

---

## Best Practices Reviewed

### MySQL ENUM Best Practices

**Key Findings**:
- ✅ ENUMs are performant and type-safe for known, stable value sets
- ✅ Adding values to end of ENUM is safe and backward compatible
- ⚠️ ENUM alteration requires table-level lock (brief downtime acceptable)
- ✅ Our use case (activity types) is ideal for ENUM - stable set of values

**Source**: MySQL Documentation - https://dev.mysql.com/doc/refman/8.0/en/enum.html

**Application**: Our implementation adds 'contract' to the end of the ENUM, which is the safest approach.

---

### React Component State Management

**Key Findings**:
- ✅ Constants-based approach is best practice for dropdown options
- ✅ Centralized constants enable consistency across components
- ✅ No Redux/state management needed for static constants

**Application**: Our use of `constants.js` follows React best practices for managing static dropdown values.

---

### Clean Architecture Computed Properties

**Key Findings**:
- ✅ Computed properties prevent duplication of type-checking logic
- ✅ `[NotMapped]` attribute ensures they're not persisted
- ✅ Pattern established in domain-driven design literature

**Source**: Clean Architecture (Robert C. Martin) - Domain entity guidelines

**Application**: Our `IsContract` computed property follows this established pattern.

---

## Risks and Mitigations

### Risk 1: Database Downtime During ENUM Alteration

**Risk Level**: LOW
**Impact**: Brief table lock during ALTER TABLE operation
**Mitigation**:
- Execute during maintenance window
- Test on staging environment first
- Monitor lock duration (typically <1 second for crm_activity table size)

---

### Risk 2: Frontend Caching Issues

**Risk Level**: LOW
**Impact**: Users might see old constants.js without 'contract' option
**Mitigation**:
- Cache-busting via Vite build process (automatic)
- Increment version in package.json to force refresh
- No manual intervention needed (Vite handles this)

---

### Risk 3: Existing Activity Components Not Recognizing Contract Type

**Risk Level**: VERY LOW
**Impact**: Some components might not display contract activities correctly
**Mitigation**:
- Most components reference `ACTIVITY_TYPES` constant (auto-updated)
- ActivityFeed.jsx explicitly handles each type (requires manual update - documented in tasks)
- Manual testing checklist to verify all activity views

---

## Open Questions

**None.** All design decisions are final and documented above.

---

## Summary

This feature is a straightforward extension following well-established patterns in the codebase:

1. **Database**: Add 'contract' to ActivityType ENUM (1 line change)
2. **Backend**: Add `IsContract` computed property to 2 classes (2 line changes)
3. **Frontend**: Add 'contract' to 2 constants and 1 categorization switch (3 small changes)

**Total Implementation Effort**: 5 files, ~10 lines of code changes

**Complexity**: Very Low - follows existing patterns with no new architectural patterns or dependencies

**Next Phase**: Proceed to Phase 1 (Data Model, Contracts, Quickstart)
