using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Email Template Variable repository implementation using Dapper
    /// </summary>
    public class EmailTemplateVariableRepository : DapperRepository<EmailTemplateVariable, long>, IEmailTemplateVariableRepository
    {
        public EmailTemplateVariableRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Get all active variables
        /// </summary>
        public async Task<IEnumerable<EmailTemplateVariable>> GetAllActiveAsync(CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_email_template_variables 
                WHERE IsActive = 1 
                ORDER BY EntityType, DisplayOrder, VariableName";

            return await Connection.QueryAsync<EmailTemplateVariable>(sql, transaction: Transaction);
        }

        /// <summary>
        /// Get variables by entity type
        /// </summary>
        public async Task<IEnumerable<EmailTemplateVariable>> GetByEntityTypeAsync(string entityType, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_email_template_variables 
                WHERE IsActive = 1 AND EntityType = @EntityType 
                ORDER BY DisplayOrder, VariableName";

            return await Connection.QueryAsync<EmailTemplateVariable>(sql, new { EntityType = entityType }, Transaction);
        }

        /// <summary>
        /// Get variable by key
        /// </summary>
        public async Task<EmailTemplateVariable?> GetByKeyAsync(string variableKey, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT * FROM crm_email_template_variables 
                WHERE VariableKey = @VariableKey";

            return await Connection.QuerySingleOrDefaultAsync<EmailTemplateVariable>(sql, new { VariableKey = variableKey }, Transaction);
        }

        /// <summary>
        /// Get variables grouped by entity type
        /// </summary>
        public async Task<Dictionary<string, IEnumerable<EmailTemplateVariable>>> GetGroupedByEntityTypeAsync(CancellationToken ct = default)
        {
            var variables = await GetAllActiveAsync(ct);
            return variables.GroupBy(v => v.EntityType)
                           .ToDictionary(g => g.Key, g => g.AsEnumerable());
        }
    }
}
