using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Dapper;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace CRMSys.Infrastructure.Repositories
{
    public class CRMCategoryRepository : DapperRepository<CRMCategory, long>, ICRMCategoryRepository
    {
        public CRMCategoryRepository(IUnitOfWork unitOfWork)
            : base(unitOfWork)
        {
        }

        public async Task<bool> CheckUniqueNameAsync(string name, long? parentId, long? excludeId = null, CancellationToken ct = default)
        {
            var sql = @"SELECT COUNT(1) FROM CRM_category WHERE LOWER(TRIM(Name)) = LOWER(TRIM(@Name)) AND ((@ParentId IS NULL AND ParentId IS NULL) OR ParentId = @ParentId) ";
            if (excludeId.HasValue)
            {
                sql += " AND Id <> @ExcludeId ";
            }
            var count = await Connection.ExecuteScalarAsync<int>(sql, new { Name = name, ParentId = parentId, ExcludeId = excludeId }, Transaction);
            return count == 0;
        }
    }
}
