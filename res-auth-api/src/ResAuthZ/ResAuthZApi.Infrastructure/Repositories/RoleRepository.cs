using Dapper;
using Org.BouncyCastle.Crypto;
using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;
using System.Data;

namespace ResAuthZApi.Infrastructure.Repositories
{
    public class RoleRepository : DapperRepository<Role, int>, IRoleRepository
    {
        public RoleRepository(IUnitOfWork unitOfWork)
        : base(unitOfWork) { }

        public async Task<IEnumerable<RolePermissionFlatDto>> GetRolePermissionsFlatAsync(int roleId, string appCode)
        {
            return await Connection.QueryAsync<RolePermissionFlatDto>(
            "sp_get_role_permissions",
            new { p_roleId = roleId, p_appCode = appCode },
            commandType: System.Data.CommandType.StoredProcedure
        );
        }

        public async Task<IEnumerable<ResourcePermissionTreeDto>> GetRolePermissionsTreeAsync(int roleId, string appCode)
        {
            var rows = await Connection.QueryAsync<RolePermissionFlatDto>(
            "sp_get_role_permissions",
            new { p_roleId = roleId, p_appCode = appCode },
            commandType: CommandType.StoredProcedure
        );

            // Group thành cây Resource → Actions
            var grouped = rows
                .GroupBy(r => new { r.ResourceId, r.ResourceCode, r.ResourceName })
                .Select(g => new ResourcePermissionTreeDto
                {
                    ResourceId = g.Key.ResourceId,
                    ResourceCode = g.Key.ResourceCode,
                    ResourceName = g.Key.ResourceName,
                    Actions = g.Select(a => new ActionPermissionDto
                    {
                        ActionId = a.ActionId,
                        ActionCode = a.ActionCode,
                        ActionName = a.ActionName,
                        Enabled = a.Enabled,
                        Granted = a.Granted,
                        PermissionId = a.PermissionId,
                        PermissionCode = a.PermissionCode
                    }).ToList()
                });

            return grouped;
        }

        public async Task UpdateRolePermissionsAsync(int roleId, IEnumerable<int> permissionIds)
        {
            try
            {
                var query = "sp_update_role_permissions";
                var result = await Connection.ExecuteAsync(
                    query,
                    new { p_roleId = roleId, p_permissionIds = string.Join(",", permissionIds) },
                    transaction: Transaction, // use UnitOfWork transaction
                    commandType: CommandType.StoredProcedure
                );
            }
            catch (Exception ex)
            {
                // Log if needed, then rethrow
                throw new InvalidOperationException("An error occurred while update by stored procedure: sp_update_role_permissions.", ex);
            }
        }
    }
}
