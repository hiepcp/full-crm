#!/bin/bash

###############################################################################
# E2E Document Upload Flow Verification Script
# Subtask: subtask-6-1
# Description: Automated checks for document upload implementation
###############################################################################

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "========================================="
echo "E2E Upload Flow Verification"
echo "========================================="
echo ""

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
    else
        echo -e "${RED}✗${NC} $2"
    fi
}

# Track overall status
CHECKS_PASSED=0
CHECKS_FAILED=0

###############################################################################
# CHECK 1: Backend Files Exist
###############################################################################
echo "Checking backend implementation files..."

FILES_TO_CHECK=(
    "./crm-system/src/CRM.Domain/Entities/CRMSharepointFile.cs"
    "./crm-system/src/CRM.Application/Constants/SharePointConstants.cs"
    "./crm-system/src/CRM.Application/Services/CRMUploadService.cs"
    "./crm-system/src/CRM.Api/Controllers/SharepointController.cs"
    "./crm-system/src/CRM.Api/Program.cs"
)

for FILE in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$FILE" ]; then
        print_status 0 "Backend file exists: $(basename $FILE)"
        ((CHECKS_PASSED++))
    else
        print_status 1 "Backend file missing: $FILE"
        ((CHECKS_FAILED++))
    fi
done

echo ""

###############################################################################
# CHECK 2: Frontend Files Exist
###############################################################################
echo "Checking frontend implementation files..."

FRONTEND_FILES=(
    "./crm-system-client/src/infrastructure/api/sharepointApi.js"
    "./crm-system-client/src/application/usecases/sharepoint/UploadDocumentUseCase.js"
    "./crm-system-client/src/application/usecases/sharepoint/GetEntityDocumentsUseCase.js"
    "./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx"
    "./crm-system-client/src/presentation/components/sharepoint/DocumentUploadDialog.jsx"
    "./crm-system-client/src/presentation/pages/customer/CustomerDetail.jsx"
)

for FILE in "${FRONTEND_FILES[@]}"; do
    if [ -f "$FILE" ]; then
        print_status 0 "Frontend file exists: $(basename $FILE)"
        ((CHECKS_PASSED++))
    else
        print_status 1 "Frontend file missing: $FILE"
        ((CHECKS_FAILED++))
    fi
done

echo ""

###############################################################################
# CHECK 3: Verify Entity Model Extensions
###############################################################################
echo "Checking CRMSharepointFile entity extensions..."

ENTITY_FILE="./crm-system/src/CRM.Domain/Entities/CRMSharepointFile.cs"
if [ -f "$ENTITY_FILE" ]; then
    REQUIRED_FIELDS=("EntityType" "EntityId" "PermissionLevel" "VersionNumber")

    for FIELD in "${REQUIRED_FIELDS[@]}"; do
        if grep -q "public string? $FIELD" "$ENTITY_FILE" || grep -q "public int? $FIELD" "$ENTITY_FILE"; then
            print_status 0 "Entity field exists: $FIELD"
            ((CHECKS_PASSED++))
        else
            print_status 1 "Entity field missing: $FIELD"
            ((CHECKS_FAILED++))
        fi
    done
else
    print_status 1 "Entity file not found"
    ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 4: Verify SharePointConstants Templates
###############################################################################
echo "Checking SharePointConstants folder templates..."

CONSTANTS_FILE="./crm-system/src/CRM.Application/Constants/SharePointConstants.cs"
if [ -f "$CONSTANTS_FILE" ]; then
    TEMPLATES=("CUSTOMER_FOLDER_TEMPLATE" "LEAD_FOLDER_TEMPLATE" "DEAL_FOLDER_TEMPLATE")

    for TEMPLATE in "${TEMPLATES[@]}"; do
        if grep -q "$TEMPLATE" "$CONSTANTS_FILE"; then
            print_status 0 "Folder template exists: $TEMPLATE"
            ((CHECKS_PASSED++))
        else
            print_status 1 "Folder template missing: $TEMPLATE"
            ((CHECKS_FAILED++))
        fi
    done
else
    print_status 1 "Constants file not found"
    ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 5: Verify Upload Service Methods
###############################################################################
echo "Checking CRMUploadService methods..."

UPLOAD_SERVICE="./crm-system/src/CRM.Application/Services/CRMUploadService.cs"
if [ -f "$UPLOAD_SERVICE" ]; then
    METHODS=("UploadToEntityFolderAsync" "EnsureFolderExistsAsync" "GetUniqueFileName" "SanitizeFileName")

    for METHOD in "${METHODS[@]}"; do
        if grep -q "$METHOD" "$UPLOAD_SERVICE"; then
            print_status 0 "Upload service method exists: $METHOD"
            ((CHECKS_PASSED++))
        else
            print_status 1 "Upload service method missing: $METHOD"
            ((CHECKS_FAILED++))
        fi
    done
else
    print_status 1 "Upload service file not found"
    ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 6: Verify API Endpoints
###############################################################################
echo "Checking SharepointController endpoints..."

CONTROLLER_FILE="./crm-system/src/CRM.Api/Controllers/SharepointController.cs"
if [ -f "$CONTROLLER_FILE" ]; then
    ENDPOINTS=("GetEntityDocuments" "SyncPermissions" "Search" "GetFileVersionHistory")

    for ENDPOINT in "${ENDPOINTS[@]}"; do
        if grep -q "$ENDPOINT" "$CONTROLLER_FILE"; then
            print_status 0 "API endpoint exists: $ENDPOINT"
            ((CHECKS_PASSED++))
        else
            print_status 1 "API endpoint missing: $ENDPOINT"
            ((CHECKS_FAILED++))
        fi
    done
else
    print_status 1 "Controller file not found"
    ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 7: Verify Frontend API Client
###############################################################################
echo "Checking frontend API client methods..."

API_CLIENT="./crm-system-client/src/infrastructure/api/sharepointApi.js"
if [ -f "$API_CLIENT" ]; then
    API_METHODS=("upload" "getDocumentsByEntity" "searchDocuments" "getVersionHistory")

    for METHOD in "${API_METHODS[@]}"; do
        if grep -q "$METHOD" "$API_CLIENT"; then
            print_status 0 "API client method exists: $METHOD"
            ((CHECKS_PASSED++))
        else
            print_status 1 "API client method missing: $METHOD"
            ((CHECKS_FAILED++))
        fi
    done
else
    print_status 1 "API client file not found"
    ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 8: Verify Use Cases
###############################################################################
echo "Checking frontend use cases..."

USE_CASES=(
    "./crm-system-client/src/application/usecases/sharepoint/UploadDocumentUseCase.js"
    "./crm-system-client/src/application/usecases/sharepoint/GetEntityDocumentsUseCase.js"
    "./crm-system-client/src/application/usecases/sharepoint/SearchDocumentsUseCase.js"
    "./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js"
)

for USE_CASE in "${USE_CASES[@]}"; do
    if [ -f "$USE_CASE" ]; then
        print_status 0 "Use case exists: $(basename $USE_CASE)"
        ((CHECKS_PASSED++))
    else
        print_status 1 "Use case missing: $USE_CASE"
        ((CHECKS_FAILED++))
    fi
done

echo ""

###############################################################################
# CHECK 9: Verify UI Components
###############################################################################
echo "Checking UI components..."

UI_COMPONENTS=(
    "./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx"
    "./crm-system-client/src/presentation/components/sharepoint/DocumentUploadDialog.jsx"
    "./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx"
)

for COMPONENT in "${UI_COMPONENTS[@]}"; do
    if [ -f "$COMPONENT" ]; then
        print_status 0 "UI component exists: $(basename $COMPONENT)"
        ((CHECKS_PASSED++))
    else
        print_status 1 "UI component missing: $COMPONENT"
        ((CHECKS_FAILED++))
    fi
done

echo ""

###############################################################################
# CHECK 10: Verify CustomerDetail Integration
###############################################################################
echo "Checking CustomerDetail page integration..."

CUSTOMER_DETAIL="./crm-system-client/src/presentation/pages/customer/CustomerDetail.jsx"
if [ -f "$CUSTOMER_DETAIL" ]; then
    if grep -q "DocumentSection" "$CUSTOMER_DETAIL"; then
        print_status 0 "DocumentSection imported in CustomerDetail"
        ((CHECKS_PASSED++))
    else
        print_status 1 "DocumentSection not found in CustomerDetail"
        ((CHECKS_FAILED++))
    fi

    if grep -q 'entityType="customer"' "$CUSTOMER_DETAIL" || grep -q "entityType='customer'" "$CUSTOMER_DETAIL"; then
        print_status 0 "DocumentSection configured with entityType in CustomerDetail"
        ((CHECKS_PASSED++))
    else
        print_status 1 "DocumentSection entityType prop not configured in CustomerDetail"
        ((CHECKS_FAILED++))
    fi
else
    print_status 1 "CustomerDetail file not found"
    ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# CHECK 11: Configuration Files
###############################################################################
echo "Checking configuration files..."

if [ -f "./crm-system/src/CRM.Api/appsettings.json" ]; then
    if grep -q "CustomerFolderPath" "./crm-system/src/CRM.Api/appsettings.json"; then
        print_status 0 "SharePoint configuration in appsettings.json"
        ((CHECKS_PASSED++))
    else
        print_status 1 "SharePoint configuration missing in appsettings.json"
        ((CHECKS_FAILED++))
    fi
else
    print_status 1 "appsettings.json not found"
    ((CHECKS_FAILED++))
fi

echo ""

###############################################################################
# Summary
###############################################################################
echo "========================================="
echo "Verification Summary"
echo "========================================="
echo -e "${GREEN}Checks Passed: $CHECKS_PASSED${NC}"
echo -e "${RED}Checks Failed: $CHECKS_FAILED${NC}"
echo ""

if [ $CHECKS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All implementation files are in place!${NC}"
    echo ""
    echo "Next Steps:"
    echo "1. Review the E2E-VERIFICATION-UPLOAD-FLOW.md document"
    echo "2. Start all services (auth, backend, frontend)"
    echo "3. Run manual E2E verification steps"
    echo "4. Verify database records after upload"
    echo "5. Check SharePoint folder structure"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠ Some checks failed. Review the output above.${NC}"
    echo ""
    exit 1
fi
