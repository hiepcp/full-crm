using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    /// <summary>
    /// CategoryMapping repository implementation using Dapper
    /// </summary>
    public class CategoryMappingRepository : DapperRepository<CategoryMapping, long>, ICategoryMappingRepository
    {
        public CategoryMappingRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        /// <summary>
        /// Get category mapping by ID
        /// </summary>
        public new async Task<CategoryMapping?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_mapping WHERE Id = @Id";

            var mapping = await Connection.QuerySingleOrDefaultAsync<CategoryMapping>(
                sql, new { Id = id }, Transaction);

            return mapping;
        }

        /// <summary>
        /// Get all active category mappings
        /// </summary>
        public async Task<IEnumerable<CategoryMapping>> GetAllActiveAsync(CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_mapping WHERE IsActive = 1 ORDER BY CRMCategoryName";

            return await Connection.QueryAsync<CategoryMapping>(sql, null, Transaction);
        }

        /// <summary>
        /// Get all category mappings (including inactive)
        /// </summary>
        public async Task<IEnumerable<CategoryMapping>> GetAllAsync(CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_mapping ORDER BY CRMCategoryName";

            return await Connection.QueryAsync<CategoryMapping>(sql, null, Transaction);
        }

        /// <summary>
        /// Get category mapping by CRM Category Name
        /// </summary>
        public async Task<CategoryMapping?> GetByCRMCategoryNameAsync(string crmCategoryName, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_mapping WHERE CRMCategoryName = @CRMCategoryName AND IsActive = 1";

            var mapping = await Connection.QuerySingleOrDefaultAsync<CategoryMapping>(
                sql, new { CRMCategoryName = crmCategoryName }, Transaction);

            return mapping;
        }

        /// <summary>
        /// Get category mapping by Dynamics 365 Category Name
        /// </summary>
        public async Task<CategoryMapping?> GetByDynamics365CategoryNameAsync(string dynamics365CategoryName, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_mapping WHERE Dynamics365CategoryName = @Dynamics365CategoryName AND IsActive = 1";

            var mapping = await Connection.QuerySingleOrDefaultAsync<CategoryMapping>(
                sql, new { Dynamics365CategoryName = dynamics365CategoryName }, Transaction);

            return mapping;
        }

        /// <summary>
        /// Get category mapping by CRM Category ID
        /// </summary>
        public async Task<CategoryMapping?> GetByCRMCategoryIdAsync(string crmCategoryId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_mapping WHERE CRMCategoryId = @CRMCategoryId AND IsActive = 1";

            var mapping = await Connection.QuerySingleOrDefaultAsync<CategoryMapping>(
                sql, new { CRMCategoryId = crmCategoryId }, Transaction);

            return mapping;
        }

        /// <summary>
        /// Get category mapping by Dynamics 365 Category ID
        /// </summary>
        public async Task<CategoryMapping?> GetByDynamics365CategoryIdAsync(string dynamics365CategoryId, CancellationToken ct = default)
        {
            const string sql = "SELECT * FROM CRM_category_mapping WHERE Dynamics365CategoryId = @Dynamics365CategoryId AND IsActive = 1";

            var mapping = await Connection.QuerySingleOrDefaultAsync<CategoryMapping>(
                sql, new { Dynamics365CategoryId = dynamics365CategoryId }, Transaction);

            return mapping;
        }

        /// <summary>
        /// Check if mapping exists for CRM Category Name
        /// </summary>
        public async Task<bool> ExistsByCRMCategoryNameAsync(string crmCategoryName, CancellationToken ct = default)
        {
            var mapping = await GetByCRMCategoryNameAsync(crmCategoryName, ct);
            return mapping != null;
        }

        /// <summary>
        /// Check if mapping exists for Dynamics 365 Category Name
        /// </summary>
        public async Task<bool> ExistsByDynamics365CategoryNameAsync(string dynamics365CategoryName, CancellationToken ct = default)
        {
            var mapping = await GetByDynamics365CategoryNameAsync(dynamics365CategoryName, ct);
            return mapping != null;
        }

        /// <summary>
        /// Create new category mapping
        /// </summary>
        public async Task<long> CreateAsync(CategoryMapping categoryMapping, CancellationToken ct = default)
        {
            return await base.AddAsync(categoryMapping, ct);
        }

        /// <summary>
        /// Update existing category mapping
        /// </summary>
        public new async Task<bool> UpdateAsync(CategoryMapping categoryMapping, CancellationToken ct = default)
        {
            await base.UpdateAsync(categoryMapping, ct);
            return true;
        }

        /// <summary>
        /// Delete category mapping by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, ct);
            return true;
        }

        /// <summary>
        /// Deactivate category mapping by ID (soft delete)
        /// </summary>
        public async Task<bool> DeactivateAsync(long id, CancellationToken ct = default)
        {
            const string sql = "UPDATE CRM_category_mapping SET IsActive = 0 WHERE Id = @Id";

            var rowsAffected = await Connection.ExecuteAsync(sql, new { Id = id }, Transaction);

            return rowsAffected > 0;
        }

        /// <summary>
        /// Activate category mapping by ID
        /// </summary>
        public async Task<bool> ActivateAsync(long id, CancellationToken ct = default)
        {
            const string sql = "UPDATE CRM_category_mapping SET IsActive = 1 WHERE Id = @Id";

            var rowsAffected = await Connection.ExecuteAsync(sql, new { Id = id }, Transaction);

            return rowsAffected > 0;
        }
    }
}
