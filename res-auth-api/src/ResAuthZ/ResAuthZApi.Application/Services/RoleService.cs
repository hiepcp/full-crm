using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;

namespace ResAuthZApi.Application.Services;

public class RoleService : BaseService<Role, int>, IRoleService
{
    private readonly IRoleRepository _roleRepository;
    public RoleService(
            IRepository<Role, int> repository,
            IUnitOfWork unitOfWork,
            IRoleRepository roleRepository
        ) : base(repository, unitOfWork)
    {        
        _roleRepository = roleRepository;
    }

    public async Task<IEnumerable<RolePermissionFlatDto>> GetRolePermissionsFlatAsync(int roleId, string appCode)
    {
        return await _roleRepository.GetRolePermissionsFlatAsync(roleId, appCode);
    }

    public async Task<IEnumerable<ResourcePermissionTreeDto>> GetRolePermissionsTreeAsync(int roleId, string appCode)
    {
        return await _roleRepository.GetRolePermissionsTreeAsync(roleId, appCode);
    }

    public async Task UpdateRolePermissionsAsync(int roleId, IEnumerable<int> permissionIds)
    {
        await _roleRepository.UpdateRolePermissionsAsync(roleId, permissionIds);
    }
}