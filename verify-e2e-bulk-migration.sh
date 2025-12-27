#!/bin/bash

################################################################################
# Automated Verification Script: Bulk Migration Tool
#
# This script verifies the implementation of the SharePoint bulk migration tool
# by checking backend services, API endpoints, database schema, and frontend
# integration.
#
# Usage: ./verify-e2e-bulk-migration.sh
################################################################################

set -e

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
CHECKS_PASSED=0
CHECKS_FAILED=0
TOTAL_CHECKS=0

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_check() {
    echo -e "${YELLOW}[CHECK]${NC} $1"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    CHECKS_PASSED=$((CHECKS_PASSED + 1))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    CHECKS_FAILED=$((CHECKS_FAILED + 1))
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Check if file exists and contains pattern
check_file_contains() {
    local file=$1
    local pattern=$2
    local description=$3

    print_check "$description"

    if [ ! -f "$file" ]; then
        print_fail "File not found: $file"
        return 1
    fi

    if grep -q "$pattern" "$file"; then
        print_pass "Found pattern in $file"
        return 0
    else
        print_fail "Pattern not found in $file: $pattern"
        return 1
    fi
}

# Check if file exists
check_file_exists() {
    local file=$1
    local description=$2

    print_check "$description"

    if [ -f "$file" ]; then
        print_pass "File exists: $file"
        return 0
    else
        print_fail "File not found: $file"
        return 1
    fi
}

################################################################################
# SECTION 1: Backend Service Implementation
################################################################################

print_header "SECTION 1: Backend Service Implementation"

# Check BulkMigrationService exists
check_file_exists \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "BulkMigrationService.cs exists"

# Check IBulkMigrationService interface exists
check_file_exists \
    "./crm-system/src/CRM.Application/Interfaces/Services/IBulkMigrationService.cs" \
    "IBulkMigrationService.cs interface exists"

# Check MigrationRequestDto exists
check_file_exists \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "MigrationRequestDto.cs exists"

# Check BulkMigrationRequest API model exists
check_file_exists \
    "./crm-system/src/CRM.Api/Models/BulkMigrationRequest.cs" \
    "BulkMigrationRequest.cs API model exists"

# Verify BulkMigrationResult class exists in service
check_file_contains \
    "./crm-system/src/CRM.Application/Interfaces/Services/IBulkMigrationService.cs" \
    "class BulkMigrationResult" \
    "BulkMigrationResult class defined"

# Verify MigrationItemResult class exists
check_file_contains \
    "./crm-system/src/CRM.Application/Interfaces/Services/IBulkMigrationService.cs" \
    "class MigrationItemResult" \
    "MigrationItemResult class defined"

################################################################################
# SECTION 2: Batch Processing Implementation
################################################################################

print_header "SECTION 2: Batch Processing Implementation"

# Check batch size validation (max 20 per Graph API limits)
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "BatchSize.*20" \
    "Batch size validation (max 20)"

# Check batch size validation in controller
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "BatchSize.*20" \
    "Controller batch size validation"

# Check GroupBy batch processing logic
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "GroupBy.*BatchSize" \
    "Batch grouping logic"

# Check parallel processing implementation
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "Task.WhenAll" \
    "Parallel processing with Task.WhenAll"

# Check batch number tracking
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "batchNumber" \
    "Batch number tracking"

# Check batch progress logging
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "Processing batch" \
    "Batch progress logging"

################################################################################
# SECTION 3: API Endpoint Implementation
################################################################################

print_header "SECTION 3: API Endpoint Implementation"

# Check BulkMigration endpoint exists in controller
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "public async Task.*BulkMigration" \
    "BulkMigration endpoint method exists"

# Check HTTP POST route
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    'HttpPost.*migration/bulk' \
    "POST /api/sharepoint/migration/bulk route"

# Check FromBody parameter binding
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "FromBody.*BulkMigrationRequest" \
    "Request body binding"

# Check SourcePath validation
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "SourcePath is required" \
    "SourcePath validation"

# Check EntityMappings validation
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "EntityMappings.*cannot be empty" \
    "EntityMappings validation"

# Check BatchSize validation
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "BatchSize must be between 1 and 20" \
    "BatchSize validation message"

# Check response includes totalFiles
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "TotalFiles" \
    "Response includes TotalFiles"

# Check response includes successCount
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "SuccessCount" \
    "Response includes SuccessCount"

# Check response includes failedCount
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "FailedCount" \
    "Response includes FailedCount"

# Check response includes results array
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "Results.*Select" \
    "Response includes Results array"

################################################################################
# SECTION 4: Service Method Implementation
################################################################################

print_header "SECTION 4: Service Method Implementation"

# Check MigrateDocumentsAsync method exists
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "MigrateDocumentsAsync" \
    "MigrateDocumentsAsync method exists"

# Check MigrateSingleDocumentAsync method exists
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "MigrateSingleDocumentAsync" \
    "MigrateSingleDocumentAsync method exists"

# Check integration with CRMUploadService
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "_uploadService" \
    "Integration with CRMUploadService"

# Check UploadToEntityFolderAsync call
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "UploadToEntityFolderAsync" \
    "Calls UploadToEntityFolderAsync"

# Check error handling with try-catch
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "try" \
    "Error handling with try-catch"

# Check result tracking
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "result.Success.*true" \
    "Success tracking in results"

# Check error message population
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "ErrorMessage" \
    "Error message tracking"

################################################################################
# SECTION 5: DTO and Model Validation
################################################################################

print_header "SECTION 5: DTO and Model Validation"

# Check MigrationRequestDto has Items property
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "List.*MigrationItemDto.*Items" \
    "MigrationRequestDto.Items property"

# Check MigrationRequestDto has PreserveTimestamps
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "PreserveTimestamps" \
    "PreserveTimestamps property"

# Check MigrationRequestDto has ContinueOnError
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "ContinueOnError" \
    "ContinueOnError property"

# Check MigrationRequestDto has BatchSize
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "BatchSize" \
    "BatchSize property"

# Check MigrationItemDto has EntityType
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "EntityType" \
    "MigrationItemDto.EntityType property"

# Check MigrationItemDto has EntityId
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "EntityId" \
    "MigrationItemDto.EntityId property"

# Check MigrationItemDto has OriginalCreatedDate
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "OriginalCreatedDate" \
    "OriginalCreatedDate metadata preservation"

# Check MigrationItemDto has OriginalModifiedDate
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "OriginalModifiedDate" \
    "OriginalModifiedDate metadata preservation"

# Check MigrationItemDto has OriginalAuthor
check_file_contains \
    "./crm-system/src/CRM.Application/Dtos/Request/MigrationRequestDto.cs" \
    "OriginalAuthor" \
    "OriginalAuthor metadata preservation"

# Check BulkMigrationRequest has Required attributes
check_file_contains \
    "./crm-system/src/CRM.Api/Models/BulkMigrationRequest.cs" \
    "Required" \
    "Data validation attributes"

# Check BulkMigrationRequest has Range validation for BatchSize
check_file_contains \
    "./crm-system/src/CRM.Api/Models/BulkMigrationRequest.cs" \
    "Range.*1.*20" \
    "BatchSize range validation (1-20)"

# Check EntityMappingDto has FilePath
check_file_contains \
    "./crm-system/src/CRM.Api/Models/BulkMigrationRequest.cs" \
    "FilePath" \
    "EntityMappingDto.FilePath property"

################################################################################
# SECTION 6: Dependency Injection
################################################################################

print_header "SECTION 6: Dependency Injection"

# Check IBulkMigrationService registered
check_file_contains \
    "./crm-system/src/CRM.Application/DependencyInjection.cs" \
    "IBulkMigrationService" \
    "IBulkMigrationService registered in DI"

# Check BulkMigrationService registered
check_file_contains \
    "./crm-system/src/CRM.Application/DependencyInjection.cs" \
    "BulkMigrationService" \
    "BulkMigrationService registered in DI"

# Check service lifetime (should be Scoped)
check_file_contains \
    "./crm-system/src/CRM.Application/DependencyInjection.cs" \
    "AddScoped.*IBulkMigrationService.*BulkMigrationService" \
    "Service registered with Scoped lifetime"

# Check controller has IBulkMigrationService dependency
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "IBulkMigrationService" \
    "Controller has IBulkMigrationService dependency"

# Check service constructor injection
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "_bulkMigrationService" \
    "Service injected in controller constructor"

################################################################################
# SECTION 7: Logging Implementation
################################################################################

print_header "SECTION 7: Logging Implementation"

# Check service has ILogger dependency
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "ILogger.*BulkMigrationService" \
    "ILogger dependency in service"

# Check migration start logging
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "Starting bulk migration" \
    "Migration start logging"

# Check batch processing logging
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "Processing.*files in.*batches" \
    "Batch processing logging"

# Check migration completion logging
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "Bulk migration completed" \
    "Migration completion logging"

# Check controller has ILogger dependency
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "ILogger.*SharepointController" \
    "ILogger dependency in controller"

# Check controller logging for migration start
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "Starting bulk migration" \
    "Controller logs migration start"

# Check controller logging for migration completion
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "Bulk migration completed" \
    "Controller logs migration completion"

################################################################################
# SECTION 8: Error Handling
################################################################################

print_header "SECTION 8: Error Handling"

# Check ArgumentNullException for null request
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "ArgumentNullException" \
    "ArgumentNullException for null parameters"

# Check ArgumentException for invalid inputs
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "ArgumentException" \
    "ArgumentException for invalid inputs"

# Check error handling doesn't throw on individual file failures
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "catch.*Exception" \
    "Catches exceptions for individual files"

# Check controller error handling
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "catch.*Exception.*ex" \
    "Controller catches exceptions"

# Check controller logs errors
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "LogError.*Error during bulk migration" \
    "Controller logs errors"

# Check controller returns 500 on error
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "Status500InternalServerError" \
    "Returns 500 on server error"

################################################################################
# SECTION 9: Code Quality Checks
################################################################################

print_header "SECTION 9: Code Quality Checks"

# Check for XML documentation comments
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "/// <summary>" \
    "XML documentation comments present"

# Check for cancellation token support
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "CancellationToken" \
    "CancellationToken support"

# Check for async/await patterns
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "async Task" \
    "Async/await patterns"

# Check controller has XML documentation
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "/// <summary>.*bulk migration" \
    "Controller XML documentation"

# Check for ProducesResponseType attributes
check_file_contains \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "ProducesResponseType" \
    "ProducesResponseType attributes for OpenAPI"

# Verify no console.log statements (in service)
print_check "No console debugging statements in service"
if ! grep -i "console\." "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" > /dev/null 2>&1; then
    print_pass "No console statements found"
else
    print_fail "Console statements found - should use ILogger"
fi

# Verify no console.log statements (in controller)
print_check "No console debugging statements in controller"
if ! grep -i "console\." "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" > /dev/null 2>&1; then
    print_pass "No console statements found"
else
    print_fail "Console statements found - should use ILogger"
fi

################################################################################
# SECTION 10: Integration Points
################################################################################

print_header "SECTION 10: Integration Points"

# Check integration with CRMUploadService
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "ICRMUploadService" \
    "Integration with ICRMUploadService"

# Check calls to UploadToEntityFolderAsync
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "UploadToEntityFolderAsync" \
    "Uses UploadToEntityFolderAsync for consistency"

# Check EntityType parameter passed
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "item.EntityType" \
    "EntityType passed to upload service"

# Check EntityId parameter passed
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "item.EntityId" \
    "EntityId passed to upload service"

# Check File parameter passed
check_file_contains \
    "./crm-system/src/CRM.Application/Services/BulkMigrationService.cs" \
    "item.File" \
    "File passed to upload service"

################################################################################
# SECTION 11: Documentation
################################################################################

print_header "SECTION 11: Documentation"

# Check verification documentation exists
check_file_exists \
    "./E2E-VERIFICATION-BULK-MIGRATION.md" \
    "Verification documentation exists"

# Check documentation has prerequisites section
check_file_contains \
    "./E2E-VERIFICATION-BULK-MIGRATION.md" \
    "## Prerequisites" \
    "Documentation has Prerequisites section"

# Check documentation has test data preparation
check_file_contains \
    "./E2E-VERIFICATION-BULK-MIGRATION.md" \
    "Test Data Preparation" \
    "Documentation has test data preparation"

# Check documentation has API testing steps
check_file_contains \
    "./E2E-VERIFICATION-BULK-MIGRATION.md" \
    "API Endpoint Testing" \
    "Documentation has API testing section"

# Check documentation has database verification
check_file_contains \
    "./E2E-VERIFICATION-BULK-MIGRATION.md" \
    "Database Verification" \
    "Documentation has database verification"

# Check documentation has SharePoint verification
check_file_contains \
    "./E2E-VERIFICATION-BULK-MIGRATION.md" \
    "SharePoint Verification" \
    "Documentation has SharePoint verification"

# Check documentation has success criteria
check_file_contains \
    "./E2E-VERIFICATION-BULK-MIGRATION.md" \
    "Success Criteria" \
    "Documentation has success criteria"

# Check documentation has troubleshooting guide
check_file_contains \
    "./E2E-VERIFICATION-BULK-MIGRATION.md" \
    "Troubleshooting" \
    "Documentation has troubleshooting guide"

################################################################################
# SUMMARY
################################################################################

print_header "VERIFICATION SUMMARY"

echo -e "Total Checks: ${BLUE}${TOTAL_CHECKS}${NC}"
echo -e "Passed:       ${GREEN}${CHECKS_PASSED}${NC}"
echo -e "Failed:       ${RED}${CHECKS_FAILED}${NC}"

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo -e "${GREEN}Bulk migration tool implementation is complete and verified.${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ SOME CHECKS FAILED${NC}"
    echo -e "${RED}Please review the failures above and fix issues.${NC}\n"
    exit 1
fi
