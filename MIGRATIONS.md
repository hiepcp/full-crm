# Database Migrations Guide

This guide explains how to work with database migrations using **Evolve** in the CRM system. Evolve provides version-controlled schema changes, automatic migration execution, and rollback capabilities.

## Table of Contents

- [Overview](#overview)
- [Migration Tool: Evolve](#migration-tool-evolve)
- [Creating New Migrations](#creating-new-migrations)
- [Naming Conventions](#naming-conventions)
- [Running Migrations](#running-migrations)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)
- [Version Control Best Practices](#version-control-best-practices)
- [Multi-Environment Deployment](#multi-environment-deployment)

---

## Overview

The **CRM system** uses **Evolve** for database migrations:

- **CRM**: `./crm-system/src/CRM.Infrastructure/Migrations/`

Migrations execute **automatically on application startup** and are version-controlled in Git.

### Key Benefits

✅ **Version Control**: All schema changes tracked in Git
✅ **Automatic Execution**: Migrations run on app startup
✅ **Migration History**: `changelog` table tracks executed migrations
✅ **Checksum Validation**: Prevents accidental edits to executed migrations
✅ **Transaction-Based**: Failed migrations rollback automatically
✅ **Multi-Environment**: Same migrations run in local, staging, and production

---

## Migration Tool: Evolve

### What is Evolve?

Evolve is a SQL-first migration tool that:
- Uses plain SQL files for migrations (no C# code required)
- Automatically tracks migration history in a `changelog` table
- Validates checksums to prevent modifications to executed migrations
- Supports MySQL, PostgreSQL, SQL Server, and more

### Configuration

Evolve is configured in the CRM service's `Program.cs`:

```csharp
using Evolve;
using MySql.Data.MySqlClient;
using Serilog;

try
{
    Log.Information("📦 Starting database migration...");

    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
        ?? throw new InvalidOperationException("DefaultConnection not found in appsettings.json");

    using var connection = new MySqlConnection(connectionString);

    var evolve = new Evolve.Evolve(connection, msg => Log.Debug(msg))
    {
        Locations = new List<string> { "Migrations" },
        IsEraseDisabled = true, // CRITICAL: Disable erase in production
        MetadataTableName = "changelog",
        CommandTimeout = 60 // 60 seconds timeout for migrations
    };

    evolve.Migrate();

    Log.Information("✅ Database migration completed successfully.");
}
catch (Exception ex)
{
    Log.Error(ex, "❌ Database migration failed: {ErrorMessage}", ex.Message);
    throw; // Fail application startup if migration fails
}
```

### Key Configuration Options

- **Locations**: Directory containing migration SQL files (default: `"Migrations"`)
- **IsEraseDisabled**: **MUST BE `true`** in production to prevent accidental database wipe
- **MetadataTableName**: Name of the migration history table (default: `"changelog"`)
- **CommandTimeout**: SQL command timeout in seconds (default: `60`)

---

## Creating New Migrations

### Step 1: Determine Migration Version

Follow the **semantic versioning** strategy:

- **Major version (V2.x.x)**: Breaking changes or major features
- **Minor version (V1.1.x, V1.2.x)**: New tables, columns, procedures
- **Patch version (V1.0.1, V1.0.2)**: Bug fixes, index optimizations

**Check existing migrations** to determine the next version:

```bash
# CRM
ls ./crm-system/src/CRM.Infrastructure/Migrations/
```

### Step 2: Create Migration File

Create a new `.sql` file following the naming convention:

```
V{major}.{minor}.{patch}__{Description}.sql
```

**Examples:**

```bash
# CRM - Add index to improve query performance
touch ./crm-system/src/CRM.Infrastructure/Migrations/V1.0.1__Add_Customer_Email_Index.sql

# CRM - Add new product catalog feature
touch ./crm-system/src/CRM.Infrastructure/Migrations/V1.2.0__Add_Product_Catalog.sql
```

### Step 3: Write Migration SQL

Write **idempotent SQL** that can run multiple times safely:

```sql
-- =============================================================================
-- Migration: Add Product Catalog Table
-- Version: V1.2.0
-- Description: Adds products table for product catalog feature
-- =============================================================================

-- Create products table
CREATE TABLE IF NOT EXISTS `products` (
  `Id` CHAR(36) NOT NULL PRIMARY KEY, -- UUID
  `Name` VARCHAR(255) NOT NULL,
  `Description` TEXT,
  `Price` DECIMAL(10, 2) NOT NULL,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `IX_Products_Name` (`Name`)
);
```

### Step 4: Test Migration Locally

1. **Test on fresh database** (recommended):

```bash
# Drop database
mysql -u root -p -e "DROP DATABASE IF EXISTS crm_db;"

# Run application (migrations execute automatically)
cd ./crm-system/src/CRM.Api
dotnet run
```

2. **Test on existing database** (verify idempotency):

```bash
# Run application again
dotnet run
```

3. **Verify migration succeeded**:

```bash
# Check changelog table
mysql -u root -p -D crm_db -e "SELECT * FROM changelog ORDER BY installed_rank DESC LIMIT 5;"

# Verify table created
mysql -u root -p -D crm_db -e "SHOW TABLES;"
```

### Step 5: Commit Migration

```bash
git add ./crm-system/src/CRM.Infrastructure/Migrations/V1.2.0__Add_Product_Catalog.sql
git commit -m "feat: add product catalog table migration (V1.2.0)"
```

---

## Naming Conventions

### File Naming Pattern

```
V{version}__{description}.sql
```

**Rules:**

- **Version format**: `V{major}.{minor}.{patch}` (e.g., `V1.0.0`, `V1.1.0`, `V2.0.0`)
- **Two underscores** (`__`) separate version from description
- **Description**: Use `Snake_Case` or `PascalCase` (e.g., `Initial_Schema`, `Add_User_Roles`)
- **No spaces** in filename

### Version Numbering

| Version Type | When to Use | Example |
|--------------|-------------|---------|
| **Major (V2.0.0)** | Breaking schema changes, complete redesigns | `V2.0.0__New_Authorization_Schema.sql` |
| **Minor (V1.1.0)** | New tables, columns, or procedures | `V1.1.0__Add_User_Roles_Table.sql` |
| **Patch (V1.0.1)** | Bug fixes, indexes, constraints | `V1.0.1__Add_Missing_Indexes.sql` |

### Seed Data Versioning

Separate **seed data** from **schema migrations** using a different version namespace:

- **Schema migrations**: `V1.x.x` (tables, columns, procedures)
- **Seed data**: `V2.x.x` (initial configuration, sample data)

**Example:**

```bash
# Schema migration
./crm-system/src/CRM.Infrastructure/Migrations/V1.0.0__CRM_Initial_Schema.sql

# Seed data migration
./crm-system/src/CRM.Infrastructure/Migrations/V2.0.0__CRM_Sample_Data.sql
```

---

## Running Migrations

### Automatic Execution (Default)

Migrations run **automatically on application startup**:

```bash
# CRM API
cd ./crm-system/src/CRM.Api
dotnet run
```

**Logs:**

```
📦 Starting database migration...
🚀 Executing migration V1.0.0__CRM_Initial_Schema.sql
🚀 Executing migration V1.2.0__Add_Product_Catalog.sql
✅ Database migration completed successfully.
```

### Manual Execution (CLI)

To run migrations **without starting the application**, create a simple console app:

```csharp
// MigrationRunner/Program.cs
using Evolve;
using MySql.Data.MySqlClient;

var connectionString = args.Length > 0
    ? args[0]
    : "Server=localhost;Database=crm_db;User=root;Password=Dev@123;SslMode=None;";

using var connection = new MySqlConnection(connectionString);

var evolve = new Evolve.Evolve(connection, Console.WriteLine)
{
    Locations = new List<string> { "Migrations" },
    IsEraseDisabled = true,
    MetadataTableName = "changelog",
    CommandTimeout = 60
};

evolve.Migrate();
Console.WriteLine("✅ Migrations completed successfully.");
```

**Run:**

```bash
dotnet run --project MigrationRunner "Server=localhost;Database=crm_db;User=root;Password=Dev@123;SslMode=None;"
```

### Verify Migration Status

Check the `changelog` table to see executed migrations:

```sql
SELECT
    installed_rank,
    version,
    description,
    type,
    installed_on,
    success
FROM changelog
ORDER BY installed_rank DESC;
```

**Example output:**

```
| installed_rank | version | description              | type | installed_on        | success |
|----------------|---------|--------------------------|------|---------------------|---------|
| 2              | 1.2.0   | Add_Product_Catalog      | SQL  | 2025-12-27 10:30:15 | 1       |
| 1              | 1.0.0   | CRM_Initial_Schema       | SQL  | 2025-12-27 10:30:10 | 1       |
```

---

## Rollback Procedures

### Important: Evolve Does Not Support Automatic Down Migrations

Unlike FluentMigrator, **Evolve does not have built-in rollback support**. Rollbacks require manual intervention.

### Rollback Strategies

#### Strategy 1: Fix-Forward (Recommended)

Create a **new migration** to fix the issue:

```bash
# Original migration (broken)
V1.2.0__Add_Product_Catalog.sql

# Fix-forward migration
V1.2.1__Fix_Product_Catalog.sql
```

**Advantages:**
- ✅ Full migration history preserved
- ✅ Safe for production
- ✅ Works with existing databases

#### Strategy 2: Repair and Re-Run

If a migration **fails during execution**:

1. **Identify failed migration** from logs:

```
❌ Database migration failed: Syntax error in V1.2.0__Add_Product_Catalog.sql
```

2. **Use Evolve Repair** to clear failed migration from history:

```csharp
evolve.Repair(); // Removes failed migration from changelog
```

3. **Fix the migration SQL file**

4. **Re-run migrations**:

```bash
dotnet run
```

#### Strategy 3: Database Restore (Production)

For **critical failures in production**:

1. **Stop application** to prevent further changes
2. **Restore database** from backup
3. **Fix migration** in development
4. **Test migration** thoroughly in staging
5. **Re-deploy** with corrected migration

### Rollback Test Example

Test rollback behavior with an **intentional error**:

```sql
-- V1.1.0__Test_Rollback.sql (intentional error)
CREATE TABEL bad_syntax_table ( -- Misspelled "TABLE"
    Id INT PRIMARY KEY
);
```

**Expected behavior:**

```
❌ Database migration failed: You have an error in your SQL syntax
```

**Verify rollback:**

```bash
# Check database - no partial changes should exist
mysql -u root -p -D res_auth_db -e "SHOW TABLES LIKE 'bad_syntax_table';"
# Expected: Empty set (0.00 sec)
```

**Fix and re-run:**

```sql
-- V1.1.0__Test_Rollback.sql (corrected)
CREATE TABLE IF NOT EXISTS bad_syntax_table (
    Id INT PRIMARY KEY
);
```

---

## Troubleshooting

### Issue 1: Migration Fails with Syntax Error

**Symptoms:**

```
❌ Database migration failed: You have an error in your SQL syntax
```

**Solution:**

1. Review the migration SQL file for syntax errors
2. Test SQL manually in MySQL Workbench or CLI:

```bash
mysql -u root -p -D crm_db < ./Migrations/V1.2.0__Add_Product_Catalog.sql
```

3. Fix syntax error
4. Use `evolve.Repair()` to clear failed migration
5. Re-run migrations

### Issue 2: Checksum Mismatch

**Symptoms:**

```
❌ Migration checksum mismatch for V1.0.0__CRM_Initial_Schema.sql
```

**Cause:** You edited an already-executed migration file.

**Solution:**

**Option A: Revert Changes** (recommended)

```bash
git checkout HEAD -- ./Migrations/V1.0.0__CRM_Initial_Schema.sql
```

**Option B: Update Checksum** (development only)

```csharp
evolve.Repair(); // Recalculates checksums
```

⚠️ **WARNING**: Never use `Repair()` in production for checksum mismatches. This indicates a serious issue.

### Issue 3: Connection String Not Found

**Symptoms:**

```
❌ Database migration failed: DefaultConnection not found in appsettings.json
```

**Solution:**

Verify `appsettings.json` contains connection string:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=crm_db;User=root;Password=Dev@123;SslMode=None;"
  }
}
```

### Issue 4: Migration Files Not Copied to Output

**Symptoms:**

```
❌ No migration files found in Migrations directory
```

**Solution:**

Verify `.csproj` includes migration file copy configuration:

```xml
<ItemGroup>
  <None Include="Migrations\**\*.sql">
    <CopyToOutputDirectory>Always</CopyToOutputDirectory>
  </None>
</ItemGroup>
```

Then rebuild:

```bash
dotnet clean
dotnet build
```

### Issue 5: Database Does Not Exist

**Symptoms:**

```
❌ Database migration failed: Unknown database 'crm_db'
```

**Solution:**

Create database manually before running migrations:

```sql
CREATE DATABASE IF NOT EXISTS crm_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Or modify connection string to connect without database:

```csharp
var builder = new MySqlConnectionStringBuilder(connectionString);
var dbName = builder.Database;
builder.Database = null; // Connect without database

using var connection = new MySqlConnection(builder.ConnectionString);
connection.Open();

// Create database if not exists
using var cmd = connection.CreateCommand();
cmd.CommandText = $"CREATE DATABASE IF NOT EXISTS `{dbName}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;";
cmd.ExecuteNonQuery();

// Re-connect with database
connection.ChangeDatabase(dbName);

var evolve = new Evolve.Evolve(connection, msg => Log.Debug(msg)) { /* config */ };
evolve.Migrate();
```

---

## Version Control Best Practices

### DO ✅

- **Commit migrations immediately** after testing
- **Use descriptive commit messages**: `feat: add user roles table migration (V1.1.0)`
- **Test migrations locally** before pushing to Git
- **Review migration in pull request** before merging
- **Include migration version in PR title**: `[V1.1.0] Add Email Verification`
- **Keep migrations small and focused** (one feature per migration)
- **Use semantic versioning** consistently

### DON'T ❌

- **Never edit executed migrations** (checksum validation will fail)
- **Never commit untested migrations** to main branch
- **Never skip version numbers** (e.g., V1.0.0 → V1.2.0)
- **Never reuse version numbers** after deleting a migration
- **Never mix schema and seed data** in the same migration
- **Never use database-specific syntax** not supported by MySQL
- **Never commit connection strings** or passwords to Git

### Migration Review Checklist

Before merging a migration PR:

- [ ] Migration tested on **fresh database**
- [ ] Migration tested on **existing database** (idempotent)
- [ ] **Version number** follows semantic versioning
- [ ] **File naming** follows convention (`V{version}__{Description}.sql`)
- [ ] SQL uses **CREATE TABLE IF NOT EXISTS** pattern
- [ ] No **hardcoded values** or environment-specific data
- [ ] **Commit message** includes version number
- [ ] **Rollback plan** documented (if needed)

---

## Multi-Environment Deployment

### Local Development

```bash
# appsettings.Development.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=crm_db;User=root;Password=Dev@123;SslMode=None;"
  }
}
```

**Workflow:**

1. Create migration in feature branch
2. Test on local database
3. Commit and push to Git
4. Create pull request

### Staging Environment

```bash
# appsettings.Staging.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=staging-db.example.com;Database=crm_db;User=app_user;Password=${DB_PASSWORD};SslMode=Required;"
  }
}
```

**Deployment workflow:**

1. Deploy application to staging server
2. Migrations run automatically on startup
3. Verify logs: `✅ Database migration completed successfully.`
4. Test application functionality
5. Query `changelog` table to confirm migrations executed

### Production Environment

```bash
# appsettings.Production.json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=prod-db.example.com;Database=crm_db;User=app_user;Password=${DB_PASSWORD};SslMode=Required;"
  }
}
```

**Deployment workflow (Zero-Downtime):**

1. **Backup production database** before deployment

```bash
mysqldump -u root -p crm_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Test migrations in staging** (identical schema to production)

3. **Deploy application** (migrations run on startup)

4. **Monitor logs** for migration success/failure

5. **Verify application health**

6. **Rollback if needed** (restore from backup)

### Environment-Specific Migrations

If a migration should only run in certain environments, use environment checks:

```sql
-- V1.2.0__Add_Debug_Logging.sql (development only)

-- Skip in production (requires application-level check)
CREATE TABLE IF NOT EXISTS `debug_logs` (
  `Id` INT AUTO_INCREMENT PRIMARY KEY,
  `Message` TEXT,
  `CreatedAt` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Better approach: Use **separate migration files** with different version namespaces:

- **Development**: `V3.x.x` (debug/test data)
- **Production**: `V1.x.x` (schema only)

---

## Additional Resources

### Evolve Documentation

- **Official Docs**: https://evolve-db.netlify.app/
- **GitHub**: https://github.com/lecaillon/Evolve
- **NuGet Package**: https://www.nuget.org/packages/Evolve

### MySQL Migration Best Practices

- **ALTER TABLE**: Use `ADD COLUMN IF NOT EXISTS` for idempotency
- **CREATE INDEX**: Use `CREATE INDEX IF NOT EXISTS` (MySQL 5.7+)
- **Data Types**: Use `CHAR(36)` for UUIDs, `VARCHAR` for strings, `DATETIME` for timestamps
- **Character Set**: Always use `utf8mb4` for full Unicode support

### Related Files

- **CRM Migrations**: `./crm-system/src/CRM.Infrastructure/Migrations/`
- **Program.cs Integration**: `./crm-system/src/CRM.Api/Program.cs`

---

## Summary

✅ **Use Evolve** for SQL-first migrations
✅ **Follow naming convention**: `V{version}__{Description}.sql`
✅ **Test migrations locally** before committing
✅ **Never edit executed migrations** (checksum validation)
✅ **Use fix-forward approach** for rollbacks
✅ **Separate schema and seed data** (V1.x.x vs V2.x.x)
✅ **Keep IsEraseDisabled=true** in production
✅ **Backup production database** before deployments

For questions or issues, refer to the [Evolve documentation](https://evolve-db.netlify.app/) or contact the development team.

---

**Last Updated**: 2025-12-27
**Migration Tool**: Evolve v3.2.0
**Database**: MySQL 8.0+
