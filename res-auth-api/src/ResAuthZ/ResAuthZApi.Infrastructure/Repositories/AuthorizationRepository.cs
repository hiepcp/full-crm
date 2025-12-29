using Dapper;
using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using Shared.Dapper.Interfaces;
using System.Data;

namespace ResAuthZApi.Infrastructure.Repositories
{
    public class AuthorizationRepository : IAuthorizationRepository
    {
        private readonly IDbConnectionFactory _factory;

        public AuthorizationRepository(IDbConnectionFactory factory)
        {
            _factory = factory;
        }

    }
}
