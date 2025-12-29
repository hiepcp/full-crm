using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Application.Interfaces.Services;

namespace ResAuthZApi.Application.Services;

public class AuthorizationService : IAuthorizationService
{
    private readonly IAuthorizationRepository _repo;

    public AuthorizationService(IAuthorizationRepository repo)
    {
        _repo = repo;
    }

   
}