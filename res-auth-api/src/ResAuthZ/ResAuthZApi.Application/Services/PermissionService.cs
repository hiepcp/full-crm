using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;

namespace ResAuthZApi.Application.Services;

public class PermissionService : BaseService<Permission, int>, IPermissionService
{
    public PermissionService(
            IRepository<Permission, int> repository,
            IUnitOfWork unitOfWork
        ) : base(repository, unitOfWork)
    {
    }

}