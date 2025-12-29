using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.Dapper.Repositories;
using System.Data;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// Email Template repository implementation using Dapper
    /// </summary>
    public class EmailTemplateRepository : DapperRepository<EmailTemplate, long>, IEmailTemplateRepository
    {
        public EmailTemplateRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Get available templates for a specific user (owned + shared)
        /// </summary>
        public async Task<IEnumerable<EmailTemplate>> GetAvailableTemplatesForUserAsync(string userEmail, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT t.*
                FROM crm_email_templates t
                WHERE t.DeletedAt IS NULL 
                    AND t.IsActive = 1
                    AND (t.CreatedBy = @UserEmail OR t.IsShared = 1)
                ORDER BY t.LastUsedAt DESC, t.CreatedOn DESC";

            var templates = await Connection.QueryAsync<EmailTemplate>(
                sql,
                new { UserEmail = userEmail },
                Transaction);

            return templates;
        }

        /// <summary>
        /// Get template by ID
        /// </summary>
        override
        public async Task<EmailTemplate?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT t.*
                FROM crm_email_templates t
                WHERE t.Id = @Id AND t.DeletedAt IS NULL";

            var template = await Connection.QueryFirstOrDefaultAsync<EmailTemplate>(
                sql,
                new { Id = id },
                Transaction);

            return template;
        }

        /// <summary>
        /// Create template
        /// </summary>
        public async Task<long> CreateAsync(EmailTemplate template, CancellationToken ct = default)
        {
            const string sql = @"
                INSERT INTO crm_email_templates 
                (Name, Subject, Body, Description, CreatedBy, UpdatedBy, IsShared, Category, 
                 IsActive, UsageCount, CreatedOn, UpdatedOn)
                VALUES 
                (@Name, @Subject, @Body, @Description, @CreatedBy, @UpdatedBy, @IsShared, @Category,
                 @IsActive, @UsageCount, @CreatedOn, @UpdatedOn);
                SELECT LAST_INSERT_ID();";

            return await Connection.ExecuteScalarAsync<long>(sql, template, Transaction);
        }

        /// <summary>
        /// Update template
        /// </summary>
        override
        public async Task<bool> UpdateAsync(EmailTemplate template, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE crm_email_templates 
                SET Name = @Name, 
                    Subject = @Subject, 
                    Body = @Body, 
                    Description = @Description,
                    IsShared = @IsShared, 
                    Category = @Category,
                    IsActive = @IsActive,
                    UpdatedBy = @UpdatedBy,
                    UpdatedOn = @UpdatedOn
                WHERE Id = @Id AND DeletedAt IS NULL";

            return await Connection.ExecuteAsync(sql, template, Transaction) > 0;
        }

        /// <summary>
        /// Soft delete template
        /// </summary>
        public async Task<bool> SoftDeleteAsync(long id, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE crm_email_templates 
                SET DeletedAt = @DeletedAt, IsActive = 0 
                WHERE Id = @Id AND DeletedAt IS NULL";

            return await Connection.ExecuteAsync(sql, new { Id = id, DeletedAt = DateTime.UtcNow }, Transaction) > 0;
        }

        /// <summary>
        /// Mark template as used
        /// </summary>
        public async Task MarkAsUsedAsync(long id, CancellationToken ct = default)
        {
            const string sql = @"
                UPDATE crm_email_templates 
                SET UsageCount = UsageCount + 1, 
                    LastUsedAt = @LastUsedAt 
                WHERE Id = @Id";

            await Connection.ExecuteAsync(sql, new { Id = id, LastUsedAt = DateTime.UtcNow }, Transaction);
        }

        /// <summary>
        /// Search templates by keyword
        /// </summary>
        public async Task<IEnumerable<EmailTemplate>> SearchAsync(string userEmail, string keyword, string? category = null, CancellationToken ct = default)
        {
            var sql = @"
                SELECT t.*
                FROM crm_email_templates t
                WHERE t.DeletedAt IS NULL 
                    AND t.IsActive = 1
                    AND (t.CreatedBy = @UserEmail OR t.IsShared = 1)
                    AND (t.Name LIKE @Keyword OR t.Subject LIKE @Keyword OR t.Description LIKE @Keyword)";

            if (!string.IsNullOrEmpty(category))
            {
                sql += " AND t.Category = @Category";
            }

            sql += " ORDER BY t.LastUsedAt DESC, t.CreatedOn DESC";

            var templates = await Connection.QueryAsync<EmailTemplate>(
                sql,
                new { UserEmail = userEmail, Keyword = $"%{keyword}%", Category = category },
                Transaction);

            return templates;
        }

        /// <summary>
        /// Get templates by category
        /// </summary>
        public async Task<IEnumerable<EmailTemplate>> GetByCategoryAsync(string userEmail, string category, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT t.*
                FROM crm_email_templates t
                WHERE t.DeletedAt IS NULL 
                    AND t.IsActive = 1
                    AND (t.CreatedBy = @UserEmail OR t.IsShared = 1)
                    AND t.Category = @Category
                ORDER BY t.LastUsedAt DESC, t.CreatedOn DESC";

            var templates = await Connection.QueryAsync<EmailTemplate>(
                sql,
                new { UserEmail = userEmail, Category = category },
                Transaction);

            return templates;
        }

        /// <summary>
        /// Get user's own templates
        /// </summary>
        public async Task<IEnumerable<EmailTemplate>> GetUserTemplatesAsync(string userEmail, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT t.*
                FROM crm_email_templates t
                WHERE t.DeletedAt IS NULL 
                    AND t.IsActive = 1
                    AND t.CreatedBy = @UserEmail
                ORDER BY t.LastUsedAt DESC, t.CreatedOn DESC";

            var templates = await Connection.QueryAsync<EmailTemplate>(
                sql,
                new { UserEmail = userEmail },
                Transaction);

            return templates;
        }

        /// <summary>
        /// Get shared templates (not owned by user)
        /// </summary>
        public async Task<IEnumerable<EmailTemplate>> GetSharedTemplatesAsync(string userEmail, CancellationToken ct = default)
        {
            const string sql = @"
                SELECT t.*
                FROM crm_email_templates t
                WHERE t.DeletedAt IS NULL 
                    AND t.IsActive = 1
                    AND t.IsShared = 1
                    AND t.CreatedBy != @UserEmail
                ORDER BY t.LastUsedAt DESC, t.CreatedOn DESC";

            var templates = await Connection.QueryAsync<EmailTemplate>(
                sql,
                new { UserEmail = userEmail },
                Transaction);

            return templates;
        }
    }
}
