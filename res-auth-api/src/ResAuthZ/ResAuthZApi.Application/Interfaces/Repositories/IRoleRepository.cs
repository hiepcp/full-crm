using ResAuthZApi.Application.Dtos;

namespace ResAuthZApi.Application.Interfaces.Repositories
{
    public interface IRoleRepository
    {
        Task<IEnumerable<RolePermissionFlatDto>> GetRolePermissionsFlatAsync(int roleId, string appCode);
        Task<IEnumerable<ResourcePermissionTreeDto>> GetRolePermissionsTreeAsync(int roleId, string appCode);
        Task UpdateRolePermissionsAsync(int roleId, IEnumerable<int> permissionIds);
    }
}
