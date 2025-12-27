using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for CategoryMapping entity operations
    /// </summary>
    public interface ICategoryMappingRepository
    {
        /// <summary>
        /// Get category mapping by ID
        /// </summary>
        Task<CategoryMapping?> GetByIdAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Get all active category mappings
        /// </summary>
        Task<IEnumerable<CategoryMapping>> GetAllActiveAsync(CancellationToken ct = default);

        /// <summary>
        /// Get all category mappings (including inactive)
        /// </summary>
        Task<IEnumerable<CategoryMapping>> GetAllAsync(CancellationToken ct = default);

        /// <summary>
        /// Get category mapping by CRM Category Name
        /// </summary>
        Task<CategoryMapping?> GetByCRMCategoryNameAsync(string crmCategoryName, CancellationToken ct = default);

        /// <summary>
        /// Get category mapping by Dynamics 365 Category Name
        /// </summary>
        Task<CategoryMapping?> GetByDynamics365CategoryNameAsync(string dynamics365CategoryName, CancellationToken ct = default);

        /// <summary>
        /// Get category mapping by CRM Category ID
        /// </summary>
        Task<CategoryMapping?> GetByCRMCategoryIdAsync(string crmCategoryId, CancellationToken ct = default);

        /// <summary>
        /// Get category mapping by Dynamics 365 Category ID
        /// </summary>
        Task<CategoryMapping?> GetByDynamics365CategoryIdAsync(string dynamics365CategoryId, CancellationToken ct = default);

        /// <summary>
        /// Check if mapping exists for CRM Category Name
        /// </summary>
        Task<bool> ExistsByCRMCategoryNameAsync(string crmCategoryName, CancellationToken ct = default);

        /// <summary>
        /// Check if mapping exists for Dynamics 365 Category Name
        /// </summary>
        Task<bool> ExistsByDynamics365CategoryNameAsync(string dynamics365CategoryName, CancellationToken ct = default);

        /// <summary>
        /// Create new category mapping
        /// </summary>
        Task<long> CreateAsync(CategoryMapping categoryMapping, CancellationToken ct = default);

        /// <summary>
        /// Update existing category mapping
        /// </summary>
        Task<bool> UpdateAsync(CategoryMapping categoryMapping, CancellationToken ct = default);

        /// <summary>
        /// Delete category mapping by ID
        /// </summary>
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Deactivate category mapping by ID (soft delete)
        /// </summary>
        Task<bool> DeactivateAsync(long id, CancellationToken ct = default);

        /// <summary>
        /// Activate category mapping by ID
        /// </summary>
        Task<bool> ActivateAsync(long id, CancellationToken ct = default);
    }
}
