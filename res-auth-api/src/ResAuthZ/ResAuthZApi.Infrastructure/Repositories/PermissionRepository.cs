using Dapper;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace ResAuthZApi.Infrastructure.Repositories
{
    public class PermissionRepository : DapperRepository<Permission, int>, IPermissionRepository
    {
        public PermissionRepository(IUnitOfWork unitOfWork)
        : base(unitOfWork) { }

        public async Task DeleteByResourceIdAsync(int resourceId)
        {
            const string sql = @"DELETE FROM permissions WHERE ResourceId = @resourceId";            
            await Connection.ExecuteAsync(sql, new { resourceId }, Transaction);
        }

        public async Task<IEnumerable<Permission>> GetPermissionsByRoleAsync(int roleId)
        {
            var sql = @"
                SELECT p.PermissionId, p.ActionCode, p.ActionName, r.ResourceId
                FROM role_permissions rp
                INNER JOIN permissions p ON rp.PermissionId = p.PermissionId
                INNER JOIN resources r ON p.ResourceId = r.ResourceId
                WHERE rp.RoleId = @RoleId;";

            return await Connection.QueryAsync<Permission>(sql, new { RoleId = roleId });
        }
    }
}