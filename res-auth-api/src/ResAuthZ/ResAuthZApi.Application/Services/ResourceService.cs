using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;

namespace ResAuthZApi.Application.Services;

public class ResourceService : BaseService<Resource, int>, IResourceService
{
    private readonly IUnitOfWork _uow;
    private readonly IRepository<Resource, int> _resourceRepositoryBase;
    private readonly IRepository<Domain.Entities.Action, int> _actionRepositoryBase;
    private readonly IRepository<Permission, int> _permissionRepositoryBase;
    private readonly IPermissionRepository _permissionRepository;
    private readonly IResourceActionRepository _resourceActionRepository;

    public ResourceService(
            IRepository<Resource, int> repositoryBase,
            IUnitOfWork unitOfWork,
             IResourceActionRepository resourceActionRepository,
             IRepository<Domain.Entities.Action, int> actionRepositoryBase,
             IRepository<Permission, int> permissionRepositoryBase,
            IPermissionRepository permissionRepository
        ) : base(repositoryBase, unitOfWork)
    {
        _resourceRepositoryBase = repositoryBase;
        _uow = unitOfWork;
        _actionRepositoryBase = actionRepositoryBase;
        _permissionRepositoryBase = permissionRepositoryBase;
        _permissionRepository = permissionRepository;
        _resourceActionRepository = resourceActionRepository;
    }

    public async Task<ResourceResponse> CreateWithActionsAndPermissionsAsync(ResourceRequest request)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            // 1) Insert resource
            var resource = new Resource
            {
                AppId = request.AppId,
                Code = request.Code,
                Name = request.Name,
                Description = request.Description,
            };

            var resourceId = await _resourceRepositoryBase.AddAsync(resource);

            var permissions = new List<PermissionDto>();

            // 2) Insert resource_actions + permissions
            foreach (var actionId in request.Actions.Distinct())
            {
                await _resourceActionRepository.AddResourceActionAsync(resourceId, actionId);

                // Lấy action để build permission code
                var action = await _actionRepositoryBase.GetByIdAsync(actionId);
                if (action == null) continue;

                var permissionCode = $"{resource.Code}.{action.Code}";

                var permission = new Permission
                {
                    ResourceId = resourceId,
                    ActionId = actionId,
                    Code = permissionCode,
                    Description = $"{resource.Name} - {action.Name}"
                };

                var permissionId = await _permissionRepositoryBase.AddAsync(permission);

                permissions.Add(new PermissionDto
                {
                    PermissionId = permissionId,
                    Code = permission.Code,
                    Description = permission.Description
                });
            }

            await _uow.CommitAsync();

            return new ResourceResponse
            {
                ResourceId = resourceId,
                Code = resource.Code,
                Name = resource.Name,
                Permissions = permissions
            };
        }
        catch
        {
            await _uow.RollbackAsync();
            throw;
        }
    }

    public async Task<ResourceResponse> UpdateWithActionsAndPermissionsAsync(int id, ResourceRequest request)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            var resource = await GetByIdAsync(id);
            if (resource == null)
                throw new Exception($"Resource {id} not found");

            // 1) Update resource
            resource.Name = request.Name;
            resource.Description = request.Description;
            await _resourceRepositoryBase.UpdateAsync(resource);

            // 2) Update lại resource_actions (xóa cũ + thêm mới)
            await _resourceActionRepository.DeleteByResourceIdAsync(id);
            await _permissionRepository.DeleteByResourceIdAsync(id);

            var permissions = new List<PermissionDto>();

            foreach (var actionId in request.Actions.Distinct())
            {
                await _resourceActionRepository.AddResourceActionAsync(id, actionId);

                var action = await _actionRepositoryBase.GetByIdAsync(actionId);
                if (action == null) continue;

                var permissionCode = $"{resource.Code}.{action.Code}";

                var permission = new Permission
                {
                    ResourceId = id,
                    ActionId = actionId,
                    Code = permissionCode,
                    Description = $"{resource.Name} - {action.Name}"
                };

                var permissionId = await _permissionRepositoryBase.AddAsync(permission);
                permissions.Add(new PermissionDto
                {
                    PermissionId = permissionId,
                    Code = permission.Code,
                    Description = permission.Description
                });
            }

            await _uow.CommitAsync();

            return new ResourceResponse
            {
                ResourceId = resource.ResourceId,
                Code = resource.Code,
                Name = resource.Name,
                Permissions = permissions
            };
        }
        catch
        {
            await _uow.RollbackAsync();
            throw;
        }
    }
}