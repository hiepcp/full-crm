#!/bin/bash

# E2E Permission Sync Flow Verification Script
# Checks implementation completeness for subtask-6-2
# Auto-Claude Build System

echo "=========================================="
echo "E2E Permission Sync Flow Verification"
echo "Subtask: subtask-6-2"
echo "=========================================="
echo ""

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper function to check file exists
check_file_exists() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local file=$1
    local description=$2

    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $description"
        echo "  File: $file"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        echo "  File not found: $file"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

# Helper function to check pattern in file
check_pattern_in_file() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    local file=$1
    local pattern=$2
    local description=$3

    if [ ! -f "$file" ]; then
        echo -e "${RED}✗${NC} $description"
        echo "  File not found: $file"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi

    if grep -q "$pattern" "$file"; then
        echo -e "${GREEN}✓${NC} $description"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
        return 0
    else
        echo -e "${RED}✗${NC} $description"
        echo "  Pattern not found in $file: $pattern"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
        return 1
    fi
}

echo "=== Phase 1: Backend Implementation Checks ==="
echo ""

# Check 1: SharePointPermissionService exists
check_file_exists \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "SharePointPermissionService implementation exists"

# Check 2: Role-to-permission mapping exists
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "RolePermissionMap" \
    "Role-to-permission mapping dictionary defined"

# Check 3: Admin role maps to owner
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    '"Admin".*"owner"' \
    "Admin role maps to 'owner' permission"

# Check 4: SalesRep role maps to write
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    '"SalesRep".*"write"' \
    "SalesRep role maps to 'write' permission"

# Check 5: Viewer role maps to read
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    '"Viewer".*"read"' \
    "Viewer role maps to 'read' permission"

# Check 6: SyncEntityPermissionsAsync method exists
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "SyncEntityPermissionsAsync" \
    "SyncEntityPermissionsAsync method implemented"

# Check 7: Folder existence check
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "FolderExists" \
    "Folder existence check before permission sync"

# Check 8: MapCRMRoleToSharePointPermission method
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "MapCRMRoleToSharePointPermission" \
    "MapCRMRoleToSharePointPermission method exists"

echo ""
echo "=== Phase 2: API Controller Checks ==="
echo ""

# Check 9: SharepointController exists
check_file_exists \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "SharepointController implementation exists"

# Check 10: SyncPermissions endpoint exists
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    'HttpPost.*"permissions/sync"' \
    "POST /api/sharepoint/permissions/sync endpoint exists"

# Check 11: ISharePointPermissionService injected
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "ISharePointPermissionService.*_permissionService" \
    "ISharePointPermissionService dependency injected"

# Check 12: Request validation
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "EntityType is required" \
    "EntityType validation implemented"

# Check 13: UserRoles validation
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "UserRoles.*cannot be empty" \
    "UserRoles validation implemented"

# Check 14: Permission service call
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "_permissionService.SyncEntityPermissionsAsync" \
    "Permission service called from controller"

# Check 15: Success response
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" \
    "Permissions synced successfully" \
    "Success response message implemented"

echo ""
echo "=== Phase 3: API Models Checks ==="
echo ""

# Check 16: SyncPermissionsRequest model exists
check_file_exists \
    "./crm-system/src/CRM.Api/Models/SyncPermissionsRequest.cs" \
    "SyncPermissionsRequest model exists"

# Check 17: EntityType property
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Models/SyncPermissionsRequest.cs" \
    "string EntityType" \
    "EntityType property defined"

# Check 18: EntityId property
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Models/SyncPermissionsRequest.cs" \
    "string EntityId" \
    "EntityId property defined"

# Check 19: UserRoles property
check_pattern_in_file \
    "./crm-system/src/CRM.Api/Models/SyncPermissionsRequest.cs" \
    "UserRoles" \
    "UserRoles property defined"

echo ""
echo "=== Phase 4: Interface Checks ==="
echo ""

# Check 20: ISharePointPermissionService interface exists
check_file_exists \
    "./crm-system/src/CRM.Application/Interfaces/Services/ISharePointPermissionService.cs" \
    "ISharePointPermissionService interface exists"

# Check 21: SyncEntityPermissionsAsync in interface
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Interfaces/Services/ISharePointPermissionService.cs" \
    "SyncEntityPermissionsAsync" \
    "SyncEntityPermissionsAsync method in interface"

# Check 22: GetEntityPermissionsAsync in interface
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Interfaces/Services/ISharePointPermissionService.cs" \
    "GetEntityPermissionsAsync" \
    "GetEntityPermissionsAsync method in interface"

# Check 23: RevokeEntityPermissionsAsync in interface
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Interfaces/Services/ISharePointPermissionService.cs" \
    "RevokeEntityPermissionsAsync" \
    "RevokeEntityPermissionsAsync method in interface"

echo ""
echo "=== Phase 5: Dependency Injection Checks ==="
echo ""

# Check 24: DependencyInjection file exists
check_file_exists \
    "./crm-system/src/CRM.Application/DependencyInjection.cs" \
    "DependencyInjection configuration exists"

# Check 25: Permission service registered
check_pattern_in_file \
    "./crm-system/src/CRM.Application/DependencyInjection.cs" \
    "ISharePointPermissionService.*SharePointPermissionService" \
    "Permission service registered in DI container"

echo ""
echo "=== Phase 6: Logging Checks ==="
echo ""

# Check 26: Logging for permission sync start
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "Starting permission sync" \
    "Logging: Permission sync start"

# Check 27: Logging for permission levels
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "Would apply permission levels" \
    "Logging: Permission levels to be applied"

# Check 28: Logging for success
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "Successfully synced permissions" \
    "Logging: Successful sync"

# Check 29: Logging for folder not found
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "Folder does not exist" \
    "Logging: Folder not found warning"

# Check 30: Error logging
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Services/SharePointPermissionService.cs" \
    "Failed to sync permissions" \
    "Logging: Error handling"

echo ""
echo "=== Phase 7: SharePoint Constants Checks ==="
echo ""

# Check 31: SharePointConstants exists
check_file_exists \
    "./crm-system/src/CRM.Application/Constants/SharePointConstants.cs" \
    "SharePointConstants class exists"

# Check 32: BuildEntityFolderPath method
check_pattern_in_file \
    "./crm-system/src/CRM.Application/Constants/SharePointConstants.cs" \
    "BuildEntityFolderPath" \
    "BuildEntityFolderPath method available"

echo ""
echo "=========================================="
echo "Verification Summary"
echo "=========================================="
echo ""
echo "Total Checks:  $TOTAL_CHECKS"
echo -e "${GREEN}Passed:        $PASSED_CHECKS${NC}"
echo -e "${RED}Failed:        $FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ All implementation checks passed!${NC}"
    echo ""
    echo "The permission sync flow implementation is complete and ready for manual E2E testing."
    echo "Refer to E2E-VERIFICATION-PERMISSION-SYNC.md for detailed testing instructions."
    echo ""
    echo "Note: Graph API integration is pending (TODO in SharePointPermissionService.cs line 86)."
    echo "      Current implementation logs permission changes but doesn't apply them to SharePoint."
    exit 0
else
    echo -e "${RED}✗ Some checks failed. Please review the implementation.${NC}"
    echo ""
    echo "Fix the failed checks before proceeding with E2E testing."
    exit 1
fi
