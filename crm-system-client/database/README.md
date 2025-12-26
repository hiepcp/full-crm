# Database Setup Guide

## Environment Configuration

Create a `.env` file in the project root with your database credentials:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=crm_system
DB_USER=postgres
DB_PASSWORD=your_password
```

## Quick Setup

1. **Create Database**:
```bash
createdb crm_system
```

2. **Import Schema**:
```bash
psql -d crm_system -f database-schema.sql
```

3. **Install Dependencies**:
```bash
npm install
```

4. **Import Sample Data**:
```bash
npm run db:import
```

## Import Options

```bash
# Import all data
npm run db:import

# Import specific table only
npm run db:import:table users

# Show help
npm run db:help

# Dry run (preview)
node import-sample-data.js --dry-run
```

## Database Structure

After import, you'll have:

- **15 tables** (13 core + 2 junction)
- **~150 sample records**
- **45 indexes** for performance
- **7 triggers** for auto-updates
- **2 views** for business metrics

## Troubleshooting

**Connection Issues**:
- Ensure PostgreSQL is running
- Check database credentials in `.env`
- Verify database exists: `psql -l`

**Import Errors**:
- Check table order (dependencies)
- Verify mockup JSON files exist
- Check foreign key constraints

**Performance**:
- Indexes are automatically created
- Views provide business metrics
- JSONB fields for flexible data storage
