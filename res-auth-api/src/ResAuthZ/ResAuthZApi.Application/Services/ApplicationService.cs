using ResAuthZApi.Application.Interfaces.Services;
using Shared.Dapper.Interfaces;

namespace ResAuthZApi.Application.Services;

public class ApplicationService : BaseService<Domain.Entities.Application, int>, IApplicationService
{
    public ApplicationService(
            IRepository<Domain.Entities.Application, int> repository,
            IUnitOfWork unitOfWork
        ) : base(repository, unitOfWork)
    {
    }

    
}