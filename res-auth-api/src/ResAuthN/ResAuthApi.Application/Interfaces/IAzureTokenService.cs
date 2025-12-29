using ResAuthApi.Application.Constants;
using ResAuthApi.Domain.Entities;

namespace ResAuthApi.Application.Interfaces
{
    public interface IAzureTokenService
    {
        Task<string?> GetAccessTokenByEnv(string appName, AppEnv env, string serviceName);        
    }
}
