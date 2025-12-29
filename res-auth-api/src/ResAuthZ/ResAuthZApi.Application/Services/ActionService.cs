using ResAuthZApi.Application.Interfaces.Services;
using Shared.Dapper.Interfaces;

namespace ResAuthZApi.Application.Services;

public class ActionService : BaseService<Domain.Entities.Action, int>, IActionService
{
    public ActionService(
            IRepository<Domain.Entities.Action, int> repository,
            IUnitOfWork unitOfWork
        ) : base(repository, unitOfWork)
    {
    }

    
}