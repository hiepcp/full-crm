#!/bin/bash

###############################################################################
# Automated Verification Script: Unified Search Functionality
# Subtask: subtask-6-3
# Phase: End-to-End Integration & Verification
###############################################################################

set -e  # Exit on error

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

# Function to print colored output
print_header() {
    echo -e "${BLUE}============================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}============================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_failure() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED_CHECKS++))
    ((TOTAL_CHECKS++))
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

print_section() {
    echo ""
    echo -e "${BLUE}--- $1 ---${NC}"
}

###############################################################################
# Check 1: Verify Backend Implementation Files Exist
###############################################################################

print_header "CHECK 1: Backend Implementation Files"

# UnifiedSearchService
if [ -f "./crm-system/src/CRM.Application/Services/UnifiedSearchService.cs" ]; then
    print_success "UnifiedSearchService.cs exists"
else
    print_failure "UnifiedSearchService.cs NOT FOUND"
fi

# IUnifiedSearchService
if [ -f "./crm-system/src/CRM.Application/Interfaces/Services/IUnifiedSearchService.cs" ]; then
    print_success "IUnifiedSearchService.cs exists"
else
    print_failure "IUnifiedSearchService.cs NOT FOUND"
fi

# SearchResultDto
if [ -f "./crm-system/src/CRM.Application/Dtos/Response/SearchResultDto.cs" ]; then
    print_success "SearchResultDto.cs exists"
else
    print_failure "SearchResultDto.cs NOT FOUND"
fi

# SharepointController (should have Search endpoint)
if [ -f "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" ]; then
    print_success "SharepointController.cs exists"
else
    print_failure "SharepointController.cs NOT FOUND"
fi

###############################################################################
# Check 2: Verify Frontend Implementation Files Exist
###############################################################################

print_header "CHECK 2: Frontend Implementation Files"

# sharepointApi.js
if [ -f "./crm-system-client/src/infrastructure/api/sharepointApi.js" ]; then
    print_success "sharepointApi.js exists"
else
    print_failure "sharepointApi.js NOT FOUND"
fi

# SearchDocumentsUseCase
if [ -f "./crm-system-client/src/application/usecases/sharepoint/SearchDocumentsUseCase.js" ]; then
    print_success "SearchDocumentsUseCase.js exists"
else
    print_failure "SearchDocumentsUseCase.js NOT FOUND"
fi

###############################################################################
# Check 3: Verify Code Implementation Details
###############################################################################

print_header "CHECK 3: Code Implementation Details"

print_section "Backend: UnifiedSearchService"

# Check if SearchDocumentsAsync method exists
if grep -q "SearchDocumentsAsync" "./crm-system/src/CRM.Application/Services/UnifiedSearchService.cs" 2>/dev/null; then
    print_success "SearchDocumentsAsync method exists"
else
    print_failure "SearchDocumentsAsync method NOT FOUND"
fi

# Check if parallel search execution exists (Task.WhenAll)
if grep -q "Task.WhenAll" "./crm-system/src/CRM.Application/Services/UnifiedSearchService.cs" 2>/dev/null; then
    print_success "Parallel search execution implemented (Task.WhenAll)"
else
    print_failure "Parallel search execution NOT FOUND"
fi

# Check if merge and deduplicate logic exists
if grep -q "MergeAndDeduplicateResults" "./crm-system/src/CRM.Application/Services/UnifiedSearchService.cs" 2>/dev/null; then
    print_success "MergeAndDeduplicateResults method exists"
else
    print_failure "MergeAndDeduplicateResults method NOT FOUND"
fi

print_section "Backend: SearchResultDto"

# Check if Source field exists in DTO
if grep -q "Source" "./crm-system/src/CRM.Application/Dtos/Response/SearchResultDto.cs" 2>/dev/null; then
    print_success "Source field exists in SearchResultDto"
else
    print_failure "Source field NOT FOUND in SearchResultDto"
fi

# Check if RelevanceScore field exists
if grep -q "RelevanceScore" "./crm-system/src/CRM.Application/Dtos/Response/SearchResultDto.cs" 2>/dev/null; then
    print_success "RelevanceScore field exists in SearchResultDto"
else
    print_failure "RelevanceScore field NOT FOUND in SearchResultDto"
fi

# Check if MatchedSnippet field exists
if grep -q "MatchedSnippet" "./crm-system/src/CRM.Application/Dtos/Response/SearchResultDto.cs" 2>/dev/null; then
    print_success "MatchedSnippet field exists in SearchResultDto"
else
    print_failure "MatchedSnippet field NOT FOUND in SearchResultDto"
fi

print_section "Backend: SharepointController Search Endpoint"

# Check if Search endpoint exists
if grep -q 'HttpGet.*"search"' "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null; then
    print_success "Search endpoint [HttpGet(\"search\")] exists"
else
    print_failure "Search endpoint NOT FOUND in controller"
fi

# Check if IUnifiedSearchService dependency is injected
if grep -q "IUnifiedSearchService" "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null; then
    print_success "IUnifiedSearchService dependency injected in controller"
else
    print_failure "IUnifiedSearchService dependency NOT FOUND"
fi

# Check if query parameter validation exists
if grep -q 'FromQuery.*string.*q' "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null; then
    print_success "Query parameter 'q' defined in Search endpoint"
else
    print_failure "Query parameter 'q' NOT FOUND"
fi

# Check if entityType and entityId optional parameters exist
if grep -q 'string.*entityType.*null' "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null; then
    print_success "Optional entityType parameter exists"
else
    print_failure "Optional entityType parameter NOT FOUND"
fi

if grep -q 'string.*entityId.*null' "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null; then
    print_success "Optional entityId parameter exists"
else
    print_failure "Optional entityId parameter NOT FOUND"
fi

print_section "Frontend: sharepointApi.js"

# Check if searchDocuments method exists
if grep -q "searchDocuments" "./crm-system-client/src/infrastructure/api/sharepointApi.js" 2>/dev/null; then
    print_success "searchDocuments method exists in sharepointApi.js"
else
    print_failure "searchDocuments method NOT FOUND"
fi

# Check if search endpoint is correctly mapped
if grep -q '"/sharepoint/search"' "./crm-system-client/src/infrastructure/api/sharepointApi.js" 2>/dev/null; then
    print_success "Search endpoint URL correctly mapped to /sharepoint/search"
else
    print_failure "Search endpoint URL NOT FOUND or incorrect"
fi

# Check if query parameter handling exists
if grep -q 'params.*q.*query' "./crm-system-client/src/infrastructure/api/sharepointApi.js" 2>/dev/null; then
    print_success "Query parameter handling implemented"
else
    print_failure "Query parameter handling NOT FOUND"
fi

print_section "Frontend: SearchDocumentsUseCase"

# Check if execute method exists
if grep -q "execute" "./crm-system-client/src/application/usecases/sharepoint/SearchDocumentsUseCase.js" 2>/dev/null; then
    print_success "execute method exists in SearchDocumentsUseCase"
else
    print_failure "execute method NOT FOUND"
fi

# Check if repository pattern is used
if grep -q "repository" "./crm-system-client/src/application/usecases/sharepoint/SearchDocumentsUseCase.js" 2>/dev/null; then
    print_success "Repository pattern used in SearchDocumentsUseCase"
else
    print_failure "Repository pattern NOT FOUND"
fi

###############################################################################
# Check 4: Dependency Injection Registration
###############################################################################

print_header "CHECK 4: Dependency Injection Registration"

# Check if UnifiedSearchService is registered
if [ -f "./crm-system/src/CRM.Application/DependencyInjection.cs" ]; then
    if grep -q "IUnifiedSearchService" "./crm-system/src/CRM.Application/DependencyInjection.cs" 2>/dev/null; then
        print_success "IUnifiedSearchService registered in DI container"
    else
        print_failure "IUnifiedSearchService NOT registered in DI container"
    fi
else
    print_info "DependencyInjection.cs not found (may be in different location)"
fi

###############################################################################
# Check 5: Configuration Files
###############################################################################

print_header "CHECK 5: Configuration Files"

# Check appsettings.json exists
if [ -f "./crm-system/src/CRM.Api/appsettings.json" ]; then
    print_success "appsettings.json exists"

    # Check if SharePoint configuration exists
    if grep -q "Sharepoint" "./crm-system/src/CRM.Api/appsettings.json" 2>/dev/null; then
        print_success "SharePoint configuration section exists"
    else
        print_failure "SharePoint configuration section NOT FOUND"
    fi

    # Check if GraphApiBase is configured
    if grep -q "GraphApiBase" "./crm-system/src/CRM.Api/appsettings.json" 2>/dev/null; then
        print_success "GraphApiBase configured in appsettings.json"
    else
        print_failure "GraphApiBase NOT configured"
    fi
else
    print_failure "appsettings.json NOT FOUND"
fi

###############################################################################
# Check 6: Error Handling Implementation
###############################################################################

print_header "CHECK 6: Error Handling Implementation"

# Check for query validation in controller
if grep -q "IsNullOrWhiteSpace.*q" "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null; then
    print_success "Query parameter validation implemented"
else
    print_failure "Query parameter validation NOT FOUND"
fi

# Check for try-catch blocks
if grep -q "try" "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null && \
   grep -q "catch" "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null; then
    print_success "Try-catch error handling implemented in controller"
else
    print_failure "Try-catch error handling NOT FOUND in controller"
fi

# Check for logging in search service
if grep -q "LogInformation\|LogError" "./crm-system/src/CRM.Application/Services/UnifiedSearchService.cs" 2>/dev/null; then
    print_success "Logging implemented in UnifiedSearchService"
else
    print_failure "Logging NOT FOUND in UnifiedSearchService"
fi

###############################################################################
# Check 7: Documentation and Comments
###############################################################################

print_header "CHECK 7: Documentation"

# Check if verification document exists
if [ -f "./E2E-VERIFICATION-SEARCH.md" ]; then
    print_success "E2E verification document exists"
else
    print_failure "E2E verification document NOT FOUND"
fi

# Check for XML documentation in controller
if grep -q "/// <summary>" "./crm-system/src/CRM.Api/Controllers/SharepointController.cs" 2>/dev/null; then
    print_success "XML documentation exists in SharepointController"
else
    print_failure "XML documentation NOT FOUND"
fi

###############################################################################
# Summary
###############################################################################

print_header "VERIFICATION SUMMARY"

echo ""
echo -e "Total Checks: ${TOTAL_CHECKS}"
echo -e "${GREEN}Passed: ${PASSED_CHECKS}${NC}"
echo -e "${RED}Failed: ${FAILED_CHECKS}${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✓ ALL CHECKS PASSED${NC}"
    echo -e "${GREEN}Implementation is complete and ready for manual E2E testing${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Review E2E-VERIFICATION-SEARCH.md for manual testing instructions"
    echo "2. Start all services (auth, backend, frontend)"
    echo "3. Upload test document 'Q4 Proposal.pdf' to Deal 456"
    echo "4. Test search endpoint: GET /api/sharepoint/search?q=proposal"
    echo "5. Verify results contain data from both CRM and SharePoint"
    echo "6. Complete all verification steps in E2E-VERIFICATION-SEARCH.md"
    echo ""
    exit 0
else
    echo -e "${RED}✗ VERIFICATION FAILED${NC}"
    echo -e "${RED}${FAILED_CHECKS} check(s) failed${NC}"
    echo ""
    echo -e "${YELLOW}Action Required:${NC}"
    echo "Review the failed checks above and fix implementation issues"
    echo ""
    exit 1
fi
