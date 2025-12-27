# Backend Implementation Plan: Handle Addresses in Lead Updates

## Overview
The frontend has been updated to send address data when editing leads. The backend needs to be modified to process these addresses during lead updates. The system now uses dedicated tables for lead addresses (`crm_lead_address`) and customer addresses (`crm_customer_address`) instead of a generic addresses table.

## Current State
- ✅ Frontend sends `addresses` array in lead update payload
- ✅ Separate database tables: `crm_lead_address` and `crm_customer_address`
- ✅ `UpdateLeadRequest` DTO already includes `Addresses` property
- ❌ Backend `LeadService.UpdateAsync` method ignores the `addresses` field in lead updates
- ✅ Address DTOs and entities are properly structured

## Database Schema

### LeadAddress Table (`crm_lead_address`)
```sql
CREATE TABLE crm_lead_address (
    id BIGINT PRIMARY KEY,
    lead_id BIGINT NOT NULL,
    address_type VARCHAR(50) NOT NULL DEFAULT 'legal',
    company_name VARCHAR(255),
    address_line TEXT,
    postcode VARCHAR(32),
    city VARCHAR(128),
    country VARCHAR(3),
    contact_person VARCHAR(255),
    email VARCHAR(320),
    telephone_no VARCHAR(64),
    port_of_destination VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    created_on DATETIME,
    created_by VARCHAR(255),
    updated_on DATETIME,
    updated_by VARCHAR(255)
);
```

### CustomerAddress Table (`crm_customer_address`)
```sql
CREATE TABLE crm_customer_address (
    id BIGINT PRIMARY KEY,
    customer_id BIGINT NOT NULL,
    address_type VARCHAR(50) NOT NULL DEFAULT 'legal',
    company_name VARCHAR(255),
    address_line TEXT,
    postcode VARCHAR(32),
    city VARCHAR(128),
    country VARCHAR(3),
    contact_person VARCHAR(255),
    email VARCHAR(320),
    telephone_no VARCHAR(64),
    port_of_destination VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    created_on DATETIME,
    created_by VARCHAR(255),
    updated_on DATETIME,
    updated_by VARCHAR(255)
);
```

## Required Changes

### 1. Update LeadService.UpdateAsync Method
Modify the `LeadService.UpdateAsync` method to handle the `addresses` array in the request payload.

**Logic:**
1. Update the lead fields as usual
2. If `addresses` array is provided:
   - For each address in the array:
     - If `id` exists: Update the existing `LeadAddress` entity
     - If no `id`: Create new `LeadAddress` entity with `LeadId = leadId`
   - Get existing addresses for this lead from `crm_lead_address` table
   - Delete addresses that exist in DB but not in the new array
3. Use transaction to ensure data consistency

**Address Structure:**
```json
{
  "id": "number | null", // null for new addresses, existing id for updates
  "addressType": "legal" | "delivery" | "forwarder" | "forwarder_agent_asia" | "other",
  "companyName": "string",
  "addressLine": "string",
  "postcode": "string",
  "city": "string",
  "country": "string",
  "contactPerson": "string",
  "email": "string",
  "telephoneNo": "string",
  "portOfDestination": "string",
  "isPrimary": boolean
}
```

### 2. Transaction Management
- Use existing UnitOfWork pattern for transaction consistency
- Ensure lead update and address operations are atomic
- Rollback on any failure to maintain data integrity

### 3. Business Rules Validation
- Validate address uniqueness within lead (e.g., only one primary address per type)
- Ensure address types match business requirements
- Validate foreign key constraints (lead exists)

### 4. Performance Considerations
- Use bulk operations for multiple address updates
- Minimize database round trips
- Consider indexing on frequently queried address fields

## Current Implementation Status

### ✅ Completed
- Database schema with dedicated `crm_lead_address` and `crm_customer_address` tables
- Entity models (`LeadAddress`, `CustomerAddress`) with proper relationships
- DTOs (`UpdateLeadRequest` includes `Addresses`, `LeadAddressDto`)
- Repository interfaces and implementations
- Address handling in lead creation (`LeadService.CreateAsync`)
- Address loading in lead queries (`LeadService.GetByIdAsync`)

### ❌ Remaining Work
- Address handling in lead updates (`LeadService.UpdateAsync`)
- Repository methods for bulk address updates and deletes
- Comprehensive validation for address operations
- Unit tests for address update scenarios
- API documentation updates

## Risk Assessment
- **Low Risk**: Address operations are independent of core lead data
- **Medium Risk**: Transaction management needs careful implementation
- **Low Risk**: Existing patterns can be followed from create operations

## Implementation Steps

### Phase 1: Core Logic Implementation
1. **Update LeadService.UpdateAsync method** (`CRM.Application/Services/LeadService.cs`)
   - Add address handling logic similar to `CreateAsync` method
   - Implement upsert logic for addresses (create/update existing)
   - Implement cleanup logic for removed addresses
   - Use transaction scope for data consistency

2. **Add address update methods to ILeadAddressRepository** (`CRM.Application/Interfaces/Repositories/ILeadAddressRepository.cs`)
   - `Task UpdateAsync(LeadAddress address, CancellationToken ct = default)`
   - `Task BulkUpdateAsync(IEnumerable<LeadAddress> addresses, CancellationToken ct = default)`
   - `Task DeleteByIdsAsync(IEnumerable<long> ids, CancellationToken ct = default)`

3. **Implement address update methods in LeadAddressRepository** (`CRM.Infrastructure/Repositories/LeadAddressRepository.cs`)
   - Implement the new interface methods
   - Add proper SQL queries for bulk operations

### Phase 2: Validation and Error Handling
4. **Update validators** (`CRM.Application/Validators/`)
   - Ensure `UpdateLeadRequestValidator` properly validates address data
   - Add address-specific validation rules

5. **Add comprehensive error handling**
   - Handle database constraint violations
   - Provide meaningful error messages for address validation failures
   - Ensure partial failures don't corrupt data

### Phase 3: Testing and Documentation
6. **Update unit tests** (`tests/CRMApi.UnitTests/`)
   - Test lead updates with address operations (create, update, delete)
   - Test transaction rollback on failures
   - Test validation scenarios

7. **Update API documentation**
   - Document address handling in lead update endpoint
   - Update OpenAPI/Swagger specifications

## Files to Modify
- `CRM.Application\Services\LeadService.cs` - Add address handling to UpdateAsync
- `CRM.Application\Interfaces\Repositories\ILeadAddressRepository.cs` - Add update methods
- `CRM.Infrastructure\Repositories\LeadAddressRepository.cs` - Implement update methods
- `CRM.Application\Validators\UpdateLeadRequestValidator.cs` - Update validation
- `tests\CRMApi.UnitTests\` - Add comprehensive tests
- API documentation files

## Key Benefits of Current Architecture
- **Type Safety**: Dedicated `LeadAddress` and `CustomerAddress` entities
- **Performance**: Direct table access without relation type filtering
- **Maintainability**: Clear separation between lead and customer addresses
- **Extensibility**: Easy to add address types or validation rules per entity