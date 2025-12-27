#!/bin/bash

################################################################################
# End-to-End Verification Script: Version Tracking and History
# Subtask: subtask-6-4
# Feature: SharePoint Document Management Integration
#
# This script automates verification of the version tracking implementation
# by checking that all required files, code patterns, and configurations exist.
#
# Usage:
#   chmod +x verify-e2e-version-tracking.sh
#   ./verify-e2e-version-tracking.sh
#
# Exit Codes:
#   0 - All checks passed
#   1 - One or more checks failed
################################################################################

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Print header
print_header() {
    echo -e "${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}"
}

# Print check result
print_check() {
    local description="$1"
    local result="$2"
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    if [ "$result" = "PASS" ]; then
        echo -e "${GREEN}✓${NC} $description"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} $description"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

# Print section
print_section() {
    echo ""
    echo -e "${YELLOW}--- $1 ---${NC}"
}

################################################################################
# VERIFICATION CHECKS
################################################################################

print_header "VERSION TRACKING & HISTORY - IMPLEMENTATION VERIFICATION"
echo "Subtask: subtask-6-4"
echo "Date: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

################################################################################
# Section 1: Backend Files
################################################################################

print_section "Backend Files Existence"

# Check SharepointController.cs
if [ -f "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" ]; then
    print_check "SharepointController.cs exists" "PASS"
else
    print_check "SharepointController.cs exists" "FAIL"
fi

# Check ISharepointService.cs
if [ -f "./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs" ]; then
    print_check "ISharepointService.cs exists" "PASS"
else
    print_check "ISharepointService.cs exists" "FAIL"
fi

################################################################################
# Section 2: Backend API Endpoint Implementation
################################################################################

print_section "Backend API Endpoint - GetFileVersionHistory"

# Check GetFileVersionHistory method exists
if grep -q "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null; then
    print_check "GetFileVersionHistory method exists" "PASS"
else
    print_check "GetFileVersionHistory method exists" "FAIL"
fi

# Check HTTP GET route
if grep -q 'HttpGet.*files/{fileId}/versions' ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null; then
    print_check "GET route 'files/{fileId}/versions' configured" "PASS"
else
    print_check "GET route 'files/{fileId}/versions' configured" "FAIL"
fi

# Check fileId parameter validation
if grep -A 10 "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null | grep -q "IsNullOrWhiteSpace(fileId)"; then
    print_check "FileId parameter validation implemented" "PASS"
else
    print_check "FileId parameter validation implemented" "FAIL"
fi

# Check service call
if grep -A 20 "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null | grep -q "_sharepointService.GetFileVersionHistory"; then
    print_check "Calls _sharepointService.GetFileVersionHistory()" "PASS"
else
    print_check "Calls _sharepointService.GetFileVersionHistory()" "FAIL"
fi

# Check 404 handling
if grep -A 30 "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null | grep -q "NotFound"; then
    print_check "404 Not Found error handling implemented" "PASS"
else
    print_check "404 Not Found error handling implemented" "FAIL"
fi

# Check logging
if grep -A 20 "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null | grep -q "_logger.LogInformation"; then
    print_check "Logging implemented for audit trail" "PASS"
else
    print_check "Logging implemented for audit trail" "FAIL"
fi

# Check ApiResponse wrapper
if grep -A 35 "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null | grep -q "ApiResponse"; then
    print_check "ApiResponse wrapper used for consistent response" "PASS"
else
    print_check "ApiResponse wrapper used for consistent response" "FAIL"
fi

# Check ProducesResponseType attributes
if grep -B 5 "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null | grep -q "ProducesResponseType"; then
    print_check "ProducesResponseType attributes for OpenAPI docs" "PASS"
else
    print_check "ProducesResponseType attributes for OpenAPI docs" "FAIL"
fi

################################################################################
# Section 3: ISharepointService Interface Extension
################################################################################

print_section "ISharepointService Interface Extension"

# Check GetFileVersionHistory method signature
if grep -q "GetFileVersionHistory" ./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs 2>/dev/null; then
    print_check "GetFileVersionHistory method in interface" "PASS"
else
    print_check "GetFileVersionHistory method in interface" "FAIL"
fi

# Check SharePointFileVersion DTO class
if grep -q "class SharePointFileVersion" ./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs 2>/dev/null; then
    print_check "SharePointFileVersion DTO class defined" "PASS"
else
    print_check "SharePointFileVersion DTO class defined" "FAIL"
fi

# Check DTO fields
if grep -A 10 "class SharePointFileVersion" ./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs 2>/dev/null | grep -q "LastModifiedDateTime"; then
    print_check "SharePointFileVersion has LastModifiedDateTime field" "PASS"
else
    print_check "SharePointFileVersion has LastModifiedDateTime field" "FAIL"
fi

if grep -A 10 "class SharePointFileVersion" ./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs 2>/dev/null | grep -q "LastModifiedBy"; then
    print_check "SharePointFileVersion has LastModifiedBy field" "PASS"
else
    print_check "SharePointFileVersion has LastModifiedBy field" "FAIL"
fi

if grep -A 10 "class SharePointFileVersion" ./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs 2>/dev/null | grep -q "Size"; then
    print_check "SharePointFileVersion has Size field" "PASS"
else
    print_check "SharePointFileVersion has Size field" "FAIL"
fi

if grep -A 10 "class SharePointFileVersion" ./crm-system/src/CRM.Application/Interfaces/Services/ISharepointService.cs 2>/dev/null | grep -q "ETag"; then
    print_check "SharePointFileVersion has ETag field" "PASS"
else
    print_check "SharePointFileVersion has ETag field" "FAIL"
fi

################################################################################
# Section 4: Frontend Files
################################################################################

print_section "Frontend Files Existence"

# Check VersionHistoryDialog component
if [ -f "./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx" ]; then
    print_check "VersionHistoryDialog.jsx exists" "PASS"
else
    print_check "VersionHistoryDialog.jsx exists" "FAIL"
fi

# Check GetVersionHistoryUseCase
if [ -f "./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js" ]; then
    print_check "GetVersionHistoryUseCase.js exists" "PASS"
else
    print_check "GetVersionHistoryUseCase.js exists" "FAIL"
fi

# Check sharepointApi.js
if [ -f "./crm-system-client/src/infrastructure/api/sharepointApi.js" ]; then
    print_check "sharepointApi.js exists" "PASS"
else
    print_check "sharepointApi.js exists" "FAIL"
fi

# Check DocumentSection component
if [ -f "./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx" ]; then
    print_check "DocumentSection.jsx exists" "PASS"
else
    print_check "DocumentSection.jsx exists" "FAIL"
fi

################################################################################
# Section 5: Frontend VersionHistoryDialog Implementation
################################################################################

print_section "VersionHistoryDialog Component Implementation"

# Check GetVersionHistoryUseCase import
if grep -q "GetVersionHistoryUseCase" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Imports GetVersionHistoryUseCase" "PASS"
else
    print_check "Imports GetVersionHistoryUseCase" "FAIL"
fi

# Check RestSharePointRepository import
if grep -q "RestSharePointRepository" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Imports RestSharePointRepository" "PASS"
else
    print_check "Imports RestSharePointRepository" "FAIL"
fi

# Check Dialog component from Material-UI
if grep -q "Dialog" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Uses Material-UI Dialog component" "PASS"
else
    print_check "Uses Material-UI Dialog component" "FAIL"
fi

# Check useState for versions
if grep -q "useState.*versions" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "useState hook for versions state" "PASS"
else
    print_check "useState hook for versions state" "FAIL"
fi

# Check loading state
if grep -q "useState.*loading" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "useState hook for loading state" "PASS"
else
    print_check "useState hook for loading state" "FAIL"
fi

# Check error state
if grep -q "useState.*error" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "useState hook for error state" "PASS"
else
    print_check "useState hook for error state" "FAIL"
fi

# Check useEffect for loading versions
if grep -q "useEffect" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "useEffect hook for loading versions on open" "PASS"
else
    print_check "useEffect hook for loading versions on open" "FAIL"
fi

# Check loadVersionHistory function
if grep -q "loadVersionHistory" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "loadVersionHistory function implemented" "PASS"
else
    print_check "loadVersionHistory function implemented" "FAIL"
fi

# Check getVersionHistoryUseCase.execute call
if grep -q "getVersionHistoryUseCase.execute" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Calls getVersionHistoryUseCase.execute()" "PASS"
else
    print_check "Calls getVersionHistoryUseCase.execute()" "FAIL"
fi

# Check formatFileSize function
if grep -q "formatFileSize" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "formatFileSize function for display" "PASS"
else
    print_check "formatFileSize function for display" "FAIL"
fi

# Check formatDate function
if grep -q "formatDate" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "formatDate function for timestamp display" "PASS"
else
    print_check "formatDate function for timestamp display" "FAIL"
fi

# Check getVersionLabel function
if grep -q "getVersionLabel" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "getVersionLabel function (Current/v1/v2)" "PASS"
else
    print_check "getVersionLabel function (Current/v1/v2)" "FAIL"
fi

# Check LinearProgress for loading
if grep -q "LinearProgress" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "LinearProgress component for loading state" "PASS"
else
    print_check "LinearProgress component for loading state" "FAIL"
fi

# Check Alert for errors
if grep -q "Alert" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Alert component for error display" "PASS"
else
    print_check "Alert component for error display" "FAIL"
fi

# Check empty state message
if grep -q "No version history available" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Empty state message for no versions" "PASS"
else
    print_check "Empty state message for no versions" "FAIL"
fi

# Check List component for version display
if grep -q "List" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "List component for version list display" "PASS"
else
    print_check "List component for version list display" "FAIL"
fi

# Check Chip component for version labels
if grep -q "Chip" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Chip component for version labels" "PASS"
else
    print_check "Chip component for version labels" "FAIL"
fi

################################################################################
# Section 6: Frontend Use Case Implementation
################################################################################

print_section "GetVersionHistoryUseCase Implementation"

# Check class definition
if grep -q "class GetVersionHistoryUseCase" ./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js 2>/dev/null; then
    print_check "GetVersionHistoryUseCase class defined" "PASS"
else
    print_check "GetVersionHistoryUseCase class defined" "FAIL"
fi

# Check constructor with repository
if grep -q "constructor.*sharepointRepository" ./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js 2>/dev/null; then
    print_check "Constructor accepts sharepointRepository" "PASS"
else
    print_check "Constructor accepts sharepointRepository" "FAIL"
fi

# Check execute method
if grep -q "execute.*fileId" ./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js 2>/dev/null; then
    print_check "execute(fileId) method implemented" "PASS"
else
    print_check "execute(fileId) method implemented" "FAIL"
fi

# Check repository call
if grep -q "getVersionHistory" ./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js 2>/dev/null; then
    print_check "Calls repository.getVersionHistory()" "PASS"
else
    print_check "Calls repository.getVersionHistory()" "FAIL"
fi

# Check export
if grep -q "GetVersionHistoryUseCase" ./crm-system-client/src/application/usecases/sharepoint/index.js 2>/dev/null; then
    print_check "Exported from index.js" "PASS"
else
    print_check "Exported from index.js" "FAIL"
fi

################################################################################
# Section 7: Frontend API Client Implementation
################################################################################

print_section "SharePoint API Client - getVersionHistory"

# Check getVersionHistory method
if grep -q "getVersionHistory" ./crm-system-client/src/infrastructure/api/sharepointApi.js 2>/dev/null; then
    print_check "getVersionHistory method exists" "PASS"
else
    print_check "getVersionHistory method exists" "FAIL"
fi

# Check endpoint URL
if grep -A 3 "getVersionHistory" ./crm-system-client/src/infrastructure/api/sharepointApi.js 2>/dev/null | grep -q "files.*versions"; then
    print_check "Correct endpoint URL: /files/{fileId}/versions" "PASS"
else
    print_check "Correct endpoint URL: /files/{fileId}/versions" "FAIL"
fi

# Check HTTP GET method
if grep -A 3 "getVersionHistory" ./crm-system-client/src/infrastructure/api/sharepointApi.js 2>/dev/null | grep -q "\.get"; then
    print_check "Uses HTTP GET method" "PASS"
else
    print_check "Uses HTTP GET method" "FAIL"
fi

################################################################################
# Section 8: DocumentSection Integration
################################################################################

print_section "DocumentSection - Version History Button Integration"

# Check VersionHistoryDialog import
if grep -q "VersionHistoryDialog" ./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx 2>/dev/null; then
    print_check "Imports VersionHistoryDialog component" "PASS"
else
    print_check "Imports VersionHistoryDialog component" "FAIL"
fi

# Check version history button text or icon
if grep -i "version history\|HistoryIcon" ./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx 2>/dev/null | grep -q .; then
    print_check "Version History button present" "PASS"
else
    print_check "Version History button present" "FAIL"
fi

# Check VersionHistoryDialog component usage
if grep -q "<VersionHistoryDialog" ./crm-system-client/src/presentation/components/sharepoint/DocumentSection.jsx 2>/dev/null; then
    print_check "VersionHistoryDialog component rendered" "PASS"
else
    print_check "VersionHistoryDialog component rendered" "FAIL"
fi

################################################################################
# Section 9: Code Quality Checks
################################################################################

print_section "Code Quality"

# Check for console.log in VersionHistoryDialog (should not exist)
if grep -q "console\.log" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "No console.log statements in VersionHistoryDialog" "FAIL"
else
    print_check "No console.log statements in VersionHistoryDialog" "PASS"
fi

# Check for console.log in GetVersionHistoryUseCase (should not exist)
if grep -q "console\.log" ./crm-system-client/src/application/usecases/sharepoint/GetVersionHistoryUseCase.js 2>/dev/null; then
    print_check "No console.log statements in GetVersionHistoryUseCase" "FAIL"
else
    print_check "No console.log statements in GetVersionHistoryUseCase" "PASS"
fi

# Check for proper async/await in VersionHistoryDialog
if grep -q "async.*loadVersionHistory" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Async/await pattern used in VersionHistoryDialog" "PASS"
else
    print_check "Async/await pattern used in VersionHistoryDialog" "FAIL"
fi

# Check for error handling in VersionHistoryDialog
if grep -q "try\|catch" ./crm-system-client/src/presentation/components/sharepoint/VersionHistoryDialog.jsx 2>/dev/null; then
    print_check "Error handling (try/catch) in VersionHistoryDialog" "PASS"
else
    print_check "Error handling (try/catch) in VersionHistoryDialog" "FAIL"
fi

################################################################################
# Section 10: Documentation
################################################################################

print_section "Documentation"

# Check for verification documentation
if [ -f "./E2E-VERIFICATION-VERSION-TRACKING.md" ]; then
    print_check "E2E verification documentation exists" "PASS"
else
    print_check "E2E verification documentation exists" "FAIL"
fi

# Check for XML comments in controller
if grep -B 10 "GetFileVersionHistory" ./crm-system/src/CRM.Api/Controllers/SharepointController.cs 2>/dev/null | grep -q "/// <summary>"; then
    print_check "XML documentation comments in controller" "PASS"
else
    print_check "XML documentation comments in controller" "FAIL"
fi

################################################################################
# SUMMARY
################################################################################

echo ""
print_header "VERIFICATION SUMMARY"
echo "Total checks: $TOTAL_CHECKS"
echo -e "Passed: ${GREEN}$PASSED_CHECKS${NC}"
echo -e "Failed: ${RED}$FAILED_CHECKS${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ All verification checks passed!${NC}"
    echo ""
    echo "Implementation Status: ✅ READY FOR MANUAL TESTING"
    echo ""
    echo "Next Steps:"
    echo "1. Follow E2E-VERIFICATION-VERSION-TRACKING.md for manual testing"
    echo "2. Upload a test document (test.docx) to Customer 789"
    echo "3. Edit the document in SharePoint to create version 2"
    echo "4. Verify version history displays correctly in CRM UI"
    echo "5. Complete all 7 verification phases"
    echo "6. Update subtask status to 'completed' after successful verification"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Some verification checks failed${NC}"
    echo ""
    echo "Implementation Status: ⚠️  INCOMPLETE"
    echo ""
    echo "Action Required:"
    echo "1. Review failed checks above"
    echo "2. Implement missing components"
    echo "3. Re-run this verification script"
    echo "4. Proceed to manual testing only after all checks pass"
    echo ""
    exit 1
fi
