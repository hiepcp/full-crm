using System;
using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using CRM.Domain.Entities;
using CRM.Application.Dtos;

namespace CRM.Infrastructure.Repositories
{
    /// <summary>
    /// Repository for Activity data access
    /// Feature 006-contract-activity-fields: Updated SQL queries to include contract_date and contract_value
    /// </summary>
    public class ActivityRepository : IActivityRepository
    {
        private readonly IDbConnection _connection;

        public ActivityRepository(IDbConnection connection)
        {
            _connection = connection;
        }

        /// <summary>
        /// Get activity by ID
        /// T011 [US1]: Added contract_date to SELECT query
        /// T021 [US2]: Added contract_value to SELECT query
        /// </summary>
        public async Task<Activity> GetByIdAsync(int id)
        {
            const string sql = @"
                SELECT
                    id AS Id,
                    name AS Name,
                    type AS Type,
                    description AS Description,
                    due_date AS DueDate,
                    status AS Status,
                    customer_id AS CustomerId,
                    lead_id AS LeadId,
                    deal_id AS DealId,
                    contract_date AS ContractDate,        -- NEW (Feature 006)
                    contract_value AS ContractValue,      -- NEW (Feature 006)
                    created_by AS CreatedBy,
                    created_at AS CreatedAt,
                    updated_by AS UpdatedBy,
                    updated_at AS UpdatedAt
                FROM activities
                WHERE id = @Id";

            return await _connection.QueryFirstOrDefaultAsync<Activity>(sql, new { Id = id });
        }

        /// <summary>
        /// Create new activity
        /// T012 [US1]: Added contract_date to INSERT query
        /// T022 [US2]: Added contract_value to INSERT query
        /// </summary>
        public async Task<int> CreateAsync(Activity activity)
        {
            const string sql = @"
                INSERT INTO activities (
                    name, type, description, due_date, status,
                    customer_id, lead_id, deal_id,
                    contract_date, contract_value,        -- NEW (Feature 006)
                    created_by, created_at
                )
                VALUES (
                    @Name, @Type, @Description, @DueDate, @Status,
                    @CustomerId, @LeadId, @DealId,
                    @ContractDate, @ContractValue,        -- NEW (Feature 006)
                    @CreatedBy, @CreatedAt
                );
                SELECT LAST_INSERT_ID();";

            return await _connection.ExecuteScalarAsync<int>(sql, activity);
        }

        /// <summary>
        /// Update existing activity
        /// T013 [US1]: Added contract_date to UPDATE query
        /// T023 [US2]: Added contract_value to UPDATE query
        /// </summary>
        public async Task<bool> UpdateAsync(Activity activity)
        {
            const string sql = @"
                UPDATE activities
                SET
                    name = @Name,
                    type = @Type,
                    description = @Description,
                    due_date = @DueDate,
                    status = @Status,
                    customer_id = @CustomerId,
                    lead_id = @LeadId,
                    deal_id = @DealId,
                    contract_date = @ContractDate,        -- NEW (Feature 006)
                    contract_value = @ContractValue,      -- NEW (Feature 006)
                    updated_by = @UpdatedBy,
                    updated_at = @UpdatedAt
                WHERE id = @Id";

            var affectedRows = await _connection.ExecuteAsync(sql, activity);
            return affectedRows > 0;
        }

        /// <summary>
        /// Query activities with optional filters
        /// T031 [US3]: Added ContractDateFrom/To filtering
        /// T032 [US3]: Added ContractValueMin/Max filtering
        /// </summary>
        public async Task<IEnumerable<Activity>> QueryAsync(ActivityFilterRequest filter)
        {
            var sql = @"
                SELECT
                    id AS Id,
                    name AS Name,
                    type AS Type,
                    description AS Description,
                    due_date AS DueDate,
                    status AS Status,
                    customer_id AS CustomerId,
                    lead_id AS LeadId,
                    deal_id AS DealId,
                    contract_date AS ContractDate,        -- NEW (Feature 006)
                    contract_value AS ContractValue,      -- NEW (Feature 006)
                    created_by AS CreatedBy,
                    created_at AS CreatedAt,
                    updated_by AS UpdatedBy,
                    updated_at AS UpdatedAt
                FROM activities
                WHERE 1=1";

            var parameters = new DynamicParameters();

            // Existing filters
            if (!string.IsNullOrEmpty(filter.Type))
            {
                sql += " AND type = @Type";
                parameters.Add("Type", filter.Type);
            }

            if (!string.IsNullOrEmpty(filter.Status))
            {
                sql += " AND status = @Status";
                parameters.Add("Status", filter.Status);
            }

            if (filter.CustomerId.HasValue)
            {
                sql += " AND customer_id = @CustomerId";
                parameters.Add("CustomerId", filter.CustomerId.Value);
            }

            if (filter.LeadId.HasValue)
            {
                sql += " AND lead_id = @LeadId";
                parameters.Add("LeadId", filter.LeadId.Value);
            }

            if (filter.DealId.HasValue)
            {
                sql += " AND deal_id = @DealId";
                parameters.Add("DealId", filter.DealId.Value);
            }

            if (filter.DueDateFrom.HasValue)
            {
                sql += " AND due_date >= @DueDateFrom";
                parameters.Add("DueDateFrom", filter.DueDateFrom.Value);
            }

            if (filter.DueDateTo.HasValue)
            {
                sql += " AND due_date <= @DueDateTo";
                parameters.Add("DueDateTo", filter.DueDateTo.Value);
            }

            // NEW FILTERS (Feature 006-contract-activity-fields)

            // T031 [US3]: Contract date range filtering
            if (filter.ContractDateFrom.HasValue)
            {
                sql += " AND contract_date >= @ContractDateFrom";
                parameters.Add("ContractDateFrom", filter.ContractDateFrom.Value);
            }

            if (filter.ContractDateTo.HasValue)
            {
                sql += " AND contract_date <= @ContractDateTo";
                parameters.Add("ContractDateTo", filter.ContractDateTo.Value);
            }

            // T032 [US3]: Contract value range filtering
            if (filter.ContractValueMin.HasValue)
            {
                sql += " AND contract_value >= @ContractValueMin";
                parameters.Add("ContractValueMin", filter.ContractValueMin.Value);
            }

            if (filter.ContractValueMax.HasValue)
            {
                sql += " AND contract_value <= @ContractValueMax";
                parameters.Add("ContractValueMax", filter.ContractValueMax.Value);
            }

            sql += " ORDER BY created_at DESC";

            return await _connection.QueryAsync<Activity>(sql, parameters);
        }

        // Interface definition (for reference)
        public interface IActivityRepository
        {
            Task<Activity> GetByIdAsync(int id);
            Task<int> CreateAsync(Activity activity);
            Task<bool> UpdateAsync(Activity activity);
            Task<IEnumerable<Activity>> QueryAsync(ActivityFilterRequest filter);
        }
    }
}
