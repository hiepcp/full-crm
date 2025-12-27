#!/bin/bash

################################################################################
# End-to-End Verification Script for Evolve Migrations
#
# This script automatically verifies that all components are properly configured
# for the Evolve migration strategy across all 3 services.
#
# Usage: bash verify-e2e-setup.sh
################################################################################

set -e

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

# Check result function
check() {
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $2"
        PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
        echo -e "${RED}✗${NC} $2"
        FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  E2E Verification: Evolve Migrations  ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ============================================================================
# SECTION 1: Migration Files Verification
# ============================================================================
echo -e "${YELLOW}[1] Verifying Migration Files...${NC}"

# ResAuthN
if [ -f "./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/Migrations/V1.0.0__ResAuthN_Initial_Schema.sql" ]; then
    check 0 "ResAuthN migration file exists"
else
    check 1 "ResAuthN migration file exists"
fi

# ResAuthZ
RESAUTHZ_MIGRATION=""
if [ -f "./res-auth-api/res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/Migrations/V1.0.0__ResAuthZ_Initial_Schema.sql" ]; then
    RESAUTHZ_MIGRATION="./res-auth-api/res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/Migrations/V1.0.0__ResAuthZ_Initial_Schema.sql"
    check 0 "ResAuthZ migration file exists"
elif [ -f "./res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/Migrations/V1.0.0__ResAuthZ_Initial_Schema.sql" ]; then
    RESAUTHZ_MIGRATION="./res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/Migrations/V1.0.0__ResAuthZ_Initial_Schema.sql"
    check 0 "ResAuthZ migration file exists"
else
    check 1 "ResAuthZ migration file exists"
fi

# CRM Schema
if [ -f "./crm-system/src/CRM.Infrastructure/Migrations/V1.0.0__CRM_Initial_Schema.sql" ]; then
    check 0 "CRM schema migration file exists"
else
    check 1 "CRM schema migration file exists"
fi

# CRM Sample Data
if [ -f "./crm-system/src/CRM.Infrastructure/Migrations/V2.0.0__CRM_Sample_Data.sql" ]; then
    check 0 "CRM sample data migration file exists"
else
    check 1 "CRM sample data migration file exists"
fi

# Check for test rollback migration (should be removed)
if [ ! -f "./crm-system/src/CRM.Infrastructure/Migrations/V1.1.0__Test_Rollback.sql" ]; then
    check 0 "Test rollback migration removed"
else
    check 1 "Test rollback migration removed (V1.1.0__Test_Rollback.sql should be deleted)"
fi

echo ""

# ============================================================================
# SECTION 2: Program.cs Evolve Integration
# ============================================================================
echo -e "${YELLOW}[2] Verifying Program.cs Evolve Integration...${NC}"

# ResAuthApi Program.cs
RESAUTH_PROGRAM=""
if [ -f "./res-auth-api/res-auth-api/src/ResAuthApi.Api/Program.cs" ]; then
    RESAUTH_PROGRAM="./res-auth-api/res-auth-api/src/ResAuthApi.Api/Program.cs"
elif [ -f "./res-auth-api/src/ResAuthApi.Api/Program.cs" ]; then
    RESAUTH_PROGRAM="./res-auth-api/src/ResAuthApi.Api/Program.cs"
fi

if [ -n "$RESAUTH_PROGRAM" ]; then
    if grep -q "using Evolve" "$RESAUTH_PROGRAM" && grep -q "new Evolve.Evolve" "$RESAUTH_PROGRAM"; then
        check 0 "ResAuthApi Program.cs has Evolve integration"
    else
        check 1 "ResAuthApi Program.cs has Evolve integration"
    fi

    if grep -q "IsEraseDisabled = true" "$RESAUTH_PROGRAM"; then
        check 0 "ResAuthApi has IsEraseDisabled=true"
    else
        check 1 "ResAuthApi has IsEraseDisabled=true"
    fi

    if grep -q 'MetadataTableName = "changelog"' "$RESAUTH_PROGRAM"; then
        check 0 "ResAuthApi has MetadataTableName=changelog"
    else
        check 1 "ResAuthApi has MetadataTableName=changelog"
    fi

    if grep -q "Starting database migration" "$RESAUTH_PROGRAM" && grep -q "completed successfully" "$RESAUTH_PROGRAM"; then
        check 0 "ResAuthApi has emoji logging pattern"
    else
        check 1 "ResAuthApi has emoji logging pattern"
    fi
else
    check 1 "ResAuthApi Program.cs found"
    check 1 "ResAuthApi has IsEraseDisabled=true"
    check 1 "ResAuthApi has MetadataTableName=changelog"
    check 1 "ResAuthApi has emoji logging pattern"
fi

# CRM Program.cs
if [ -f "./crm-system/src/CRM.Api/Program.cs" ]; then
    if grep -q "using Evolve" "./crm-system/src/CRM.Api/Program.cs" && grep -q "new Evolve.Evolve" "./crm-system/src/CRM.Api/Program.cs"; then
        check 0 "CRM.Api Program.cs has Evolve integration"
    else
        check 1 "CRM.Api Program.cs has Evolve integration"
    fi

    if grep -q "IsEraseDisabled = true" "./crm-system/src/CRM.Api/Program.cs"; then
        check 0 "CRM.Api has IsEraseDisabled=true"
    else
        check 1 "CRM.Api has IsEraseDisabled=true"
    fi

    if grep -q 'MetadataTableName = "changelog"' "./crm-system/src/CRM.Api/Program.cs"; then
        check 0 "CRM.Api has MetadataTableName=changelog"
    else
        check 1 "CRM.Api has MetadataTableName=changelog"
    fi

    if grep -q "Starting database migration" "./crm-system/src/CRM.Api/Program.cs" && grep -q "completed successfully" "./crm-system/src/CRM.Api/Program.cs"; then
        check 0 "CRM.Api has emoji logging pattern"
    else
        check 1 "CRM.Api has emoji logging pattern"
    fi
else
    check 1 "CRM.Api Program.cs found"
    check 1 "CRM.Api has IsEraseDisabled=true"
    check 1 "CRM.Api has MetadataTableName=changelog"
    check 1 "CRM.Api has emoji logging pattern"
fi

echo ""

# ============================================================================
# SECTION 3: .csproj Configuration
# ============================================================================
echo -e "${YELLOW}[3] Verifying .csproj Configuration...${NC}"

# ResAuthN Infrastructure
if [ -f "./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/ResAuthApi.Infrastructure.csproj" ]; then
    if grep -q "Evolve" "./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/ResAuthApi.Infrastructure.csproj"; then
        check 0 "ResAuthN has Evolve package reference"
    else
        check 1 "ResAuthN has Evolve package reference"
    fi

    if grep -q "Migrations" "./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/ResAuthApi.Infrastructure.csproj"; then
        check 0 "ResAuthN configured to copy migration files"
    else
        check 1 "ResAuthN configured to copy migration files"
    fi
else
    check 1 "ResAuthN .csproj found"
    check 1 "ResAuthN configured to copy migration files"
fi

# ResAuthZ Infrastructure
RESAUTHZ_CSPROJ=""
if [ -f "./res-auth-api/res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/ResAuthZApi.Infrastructure.csproj" ]; then
    RESAUTHZ_CSPROJ="./res-auth-api/res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/ResAuthZApi.Infrastructure.csproj"
elif [ -f "./res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/ResAuthZApi.Infrastructure.csproj" ]; then
    RESAUTHZ_CSPROJ="./res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/ResAuthZApi.Infrastructure.csproj"
fi

if [ -n "$RESAUTHZ_CSPROJ" ]; then
    if grep -q "Evolve" "$RESAUTHZ_CSPROJ"; then
        check 0 "ResAuthZ has Evolve package reference"
    else
        check 1 "ResAuthZ has Evolve package reference"
    fi

    if grep -q "Migrations" "$RESAUTHZ_CSPROJ"; then
        check 0 "ResAuthZ configured to copy migration files"
    else
        check 1 "ResAuthZ configured to copy migration files"
    fi
else
    check 1 "ResAuthZ .csproj found"
    check 1 "ResAuthZ configured to copy migration files"
fi

# CRM Infrastructure
if [ -f "./crm-system/src/CRM.Infrastructure/CRM.Infrastructure.csproj" ]; then
    if grep -q "Evolve" "./crm-system/src/CRM.Infrastructure/CRM.Infrastructure.csproj"; then
        check 0 "CRM has Evolve package reference"
    else
        check 1 "CRM has Evolve package reference"
    fi

    if grep -q "Migrations" "./crm-system/src/CRM.Infrastructure/CRM.Infrastructure.csproj"; then
        check 0 "CRM configured to copy migration files"
    else
        check 1 "CRM configured to copy migration files"
    fi
else
    check 1 "CRM .csproj found"
    check 1 "CRM configured to copy migration files"
fi

echo ""

# ============================================================================
# SECTION 4: Migration SQL Validation
# ============================================================================
echo -e "${YELLOW}[4] Validating Migration SQL Files...${NC}"

# Check ResAuthN migration for key tables
if [ -f "./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/Migrations/V1.0.0__ResAuthN_Initial_Schema.sql" ]; then
    if grep -qi "CREATE TABLE.*Users" "./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/Migrations/V1.0.0__ResAuthN_Initial_Schema.sql"; then
        check 0 "ResAuthN migration contains Users table"
    else
        check 1 "ResAuthN migration contains Users table"
    fi

    if grep -qi "CREATE TABLE.*refresh.*token" "./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/Migrations/V1.0.0__ResAuthN_Initial_Schema.sql"; then
        check 0 "ResAuthN migration contains RefreshTokens table"
    else
        check 1 "ResAuthN migration contains RefreshTokens table"
    fi
else
    check 1 "ResAuthN migration contains Users table"
    check 1 "ResAuthN migration contains RefreshTokens table"
fi

# Check ResAuthZ migration for key tables
if [ -n "$RESAUTHZ_MIGRATION" ]; then
    if grep -qi "CREATE TABLE.*Applications" "$RESAUTHZ_MIGRATION"; then
        check 0 "ResAuthZ migration contains Applications table"
    else
        check 1 "ResAuthZ migration contains Applications table"
    fi

    if grep -qi "CREATE TABLE.*Permissions" "$RESAUTHZ_MIGRATION"; then
        check 0 "ResAuthZ migration contains Permissions table"
    else
        check 1 "ResAuthZ migration contains Permissions table"
    fi
else
    check 1 "ResAuthZ migration contains Applications table"
    check 1 "ResAuthZ migration contains Permissions table"
fi

# Check CRM schema migration for key tables
if [ -f "./crm-system/src/CRM.Infrastructure/Migrations/V1.0.0__CRM_Initial_Schema.sql" ]; then
    if grep -qi "CREATE TABLE.*Customer" "./crm-system/src/CRM.Infrastructure/Migrations/V1.0.0__CRM_Initial_Schema.sql"; then
        check 0 "CRM schema migration contains Customer table"
    else
        check 1 "CRM schema migration contains Customer table"
    fi

    if grep -qi "CREATE TABLE.*Lead" "./crm-system/src/CRM.Infrastructure/Migrations/V1.0.0__CRM_Initial_Schema.sql"; then
        check 0 "CRM schema migration contains Lead table"
    else
        check 1 "CRM schema migration contains Lead table"
    fi

    if grep -qi "CREATE TABLE.*Deal" "./crm-system/src/CRM.Infrastructure/Migrations/V1.0.0__CRM_Initial_Schema.sql"; then
        check 0 "CRM schema migration contains Deal table"
    else
        check 1 "CRM schema migration contains Deal table"
    fi
else
    check 1 "CRM schema migration contains Customer table"
    check 1 "CRM schema migration contains Lead table"
    check 1 "CRM schema migration contains Deal table"
fi

# Check CRM sample data migration
if [ -f "./crm-system/src/CRM.Infrastructure/Migrations/V2.0.0__CRM_Sample_Data.sql" ]; then
    if grep -qi "INSERT INTO" "./crm-system/src/CRM.Infrastructure/Migrations/V2.0.0__CRM_Sample_Data.sql"; then
        check 0 "CRM sample data migration contains INSERT statements"
    else
        check 1 "CRM sample data migration contains INSERT statements"
    fi
else
    check 1 "CRM sample data migration contains INSERT statements"
fi

echo ""

# ============================================================================
# SECTION 5: Documentation Verification
# ============================================================================
echo -e "${YELLOW}[5] Verifying Documentation...${NC}"

if [ -f "./MIGRATIONS.md" ]; then
    check 0 "MIGRATIONS.md developer guide exists"

    if grep -q "Evolve" "./MIGRATIONS.md"; then
        check 0 "MIGRATIONS.md contains Evolve documentation"
    else
        check 1 "MIGRATIONS.md contains Evolve documentation"
    fi

    if grep -q "V[0-9]\+\.[0-9]\+\.[0-9]\+" "./MIGRATIONS.md"; then
        check 0 "MIGRATIONS.md documents versioning convention"
    else
        check 1 "MIGRATIONS.md documents versioning convention"
    fi
else
    check 1 "MIGRATIONS.md developer guide exists"
    check 1 "MIGRATIONS.md contains Evolve documentation"
    check 1 "MIGRATIONS.md documents versioning convention"
fi

if [ -f "./E2E_VERIFICATION.md" ]; then
    check 0 "E2E_VERIFICATION.md exists"
else
    check 1 "E2E_VERIFICATION.md exists"
fi

echo ""

# ============================================================================
# SECTION 6: DatabaseInitializer Deprecation
# ============================================================================
echo -e "${YELLOW}[6] Verifying DatabaseInitializer Deprecation...${NC}"

# ResAuthN
RESAUTHN_DBINIT=""
if [ -f "./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/DatabaseInit/DatabaseInitializer.cs" ]; then
    RESAUTHN_DBINIT="./res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/DatabaseInit/DatabaseInitializer.cs"
elif [ -f "./res-auth-api/res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/DatabaseInit/DatabaseInitializer.cs" ]; then
    RESAUTHN_DBINIT="./res-auth-api/res-auth-api/src/ResAuthN/ResAuthApi.Infrastructure/DatabaseInit/DatabaseInitializer.cs"
fi

if [ -n "$RESAUTHN_DBINIT" ]; then
    if grep -q "Obsolete" "$RESAUTHN_DBINIT"; then
        check 0 "ResAuthN DatabaseInitializer marked as [Obsolete]"
    else
        check 1 "ResAuthN DatabaseInitializer marked as [Obsolete]"
    fi
else
    check 1 "ResAuthN DatabaseInitializer found"
fi

# ResAuthZ
RESAUTHZ_DBINIT=""
if [ -f "./res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/DatabaseInit/DatabaseInitializer.cs" ]; then
    RESAUTHZ_DBINIT="./res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/DatabaseInit/DatabaseInitializer.cs"
elif [ -f "./res-auth-api/res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/DatabaseInit/DatabaseInitializer.cs" ]; then
    RESAUTHZ_DBINIT="./res-auth-api/res-auth-api/src/ResAuthZ/ResAuthZApi.Infrastructure/DatabaseInit/DatabaseInitializer.cs"
fi

if [ -n "$RESAUTHZ_DBINIT" ]; then
    if grep -q "Obsolete" "$RESAUTHZ_DBINIT"; then
        check 0 "ResAuthZ DatabaseInitializer marked as [Obsolete]"
    else
        check 1 "ResAuthZ DatabaseInitializer marked as [Obsolete]"
    fi
else
    check 1 "ResAuthZ DatabaseInitializer found"
fi

# CRM
if [ -f "./crm-system/src/CRM.Infrastructure/DatabaseInit/DatabaseInitializer.cs" ]; then
    if grep -q "Obsolete" "./crm-system/src/CRM.Infrastructure/DatabaseInit/DatabaseInitializer.cs"; then
        check 0 "CRM DatabaseInitializer marked as [Obsolete]"
    else
        check 1 "CRM DatabaseInitializer marked as [Obsolete]"
    fi
else
    check 1 "CRM DatabaseInitializer found"
fi

echo ""

# ============================================================================
# SUMMARY
# ============================================================================
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Verification Summary                 ${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "Total Checks:  ${BLUE}${TOTAL_CHECKS}${NC}"
echo -e "Passed:        ${GREEN}${PASSED_CHECKS}${NC}"
echo -e "Failed:        ${RED}${FAILED_CHECKS}${NC}"
echo ""

if [ $FAILED_CHECKS -eq 0 ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo -e "${YELLOW}Next Steps:${NC}"
    echo "1. Remove test rollback migration (if present):"
    echo "   rm -f ./crm-system/src/CRM.Infrastructure/Migrations/V1.1.0__Test_Rollback.sql"
    echo ""
    echo "2. Follow manual verification steps in E2E_VERIFICATION.md:"
    echo "   - Drop all databases"
    echo "   - Start ResAuthApi and verify migration logs"
    echo "   - Start CRM.Api and verify migration logs"
    echo "   - Query changelog tables"
    echo "   - Verify all tables created"
    echo ""
    exit 0
else
    echo -e "${RED}❌ VERIFICATION FAILED${NC}"
    echo ""
    echo -e "${YELLOW}Please fix the failed checks above before proceeding with manual testing.${NC}"
    echo ""
    exit 1
fi
