using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Domain.Entities;

namespace ResAuthZApi.Application.Interfaces.Services
{
    public interface IRoleService : IBaseService<Role, int>
    {
        Task<IEnumerable<RolePermissionFlatDto>> GetRolePermissionsFlatAsync(int roleId, string appCode);
        Task<IEnumerable<ResourcePermissionTreeDto>> GetRolePermissionsTreeAsync(int roleId, string appCode);
        Task UpdateRolePermissionsAsync(int roleId, IEnumerable<int> permissionIds);
    }
}
