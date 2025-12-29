# Sample Data Scripts

This folder contains sample data SQL scripts for development and testing purposes.

## Files Structure

- `{Entity}SampleData.sql` - Sample data for development/testing
- Each file contains INSERT statements generated from mock JSON data

## Usage

### For Development/Testing

1. Run the DDL script first:
   ```sql
   -- Run DDL first
   SOURCE src/CRM.Infrastructure/Sqls/Tables/Lead.sql;
   ```

2. Then run the sample data:
   ```sql
   -- Insert sample data
   SOURCE src/CRM.Infrastructure/Sqls/SampleData/LeadSampleData.sql;
   ```

### Database Connection

All scripts assume the database name is `crm_system`. Update the `USE crm_sys_db;` statement if your database name differs.

### Foreign Key Considerations

- Scripts temporarily disable foreign key checks during INSERT
- Foreign key checks are re-enabled after completion
- Ensure related tables (customers, contacts, deals, users) exist before running

### Sample Data Overview

#### Lead Sample Data
- **Total records**: 12 leads
- **Converted leads**: 3 (25% conversion rate)
- **Sources**: web, event, referral, ads, facebook, other
- **Statuses**: working, qualified, new
- **Score range**: 45-92
- **Companies**: ILVA A/S, Response Vietnam, Hugga Design, etc.

#### Contact Sample Data
- **Total records**: 11 contacts
- **Primary contacts**: 8
- **Customers with contacts**: ILVA A/S (4), Hugga Design (2), etc.

### Notes

- Sample data is for development/testing only
- Production systems should use seed scripts from `Sqls/Tables/*.seed.sql`
- All datetime values use UTC format
- Boolean fields use TINYINT(1) (0=false, 1=true)
- NULL values are explicitly handled

### Generating New Sample Data

To generate sample data for other entities:

1. Use mock JSON files from `crm-system-client/src/data/`
2. Follow the pattern in existing sample data scripts
3. Use prompt template A.10 from plan.md for AI generation
