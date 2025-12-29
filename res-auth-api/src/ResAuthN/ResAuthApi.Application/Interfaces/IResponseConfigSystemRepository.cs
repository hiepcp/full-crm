using ResAuthApi.Application.Constants;
using ResAuthApi.Domain.Entities;

namespace ResAuthApi.Application.Interfaces
{
    public interface IResponseConfigSystemRepository
    {
        public Task<IEnumerable<ResponseConfigSystem>> GetAll();
        public Task<ResponseConfigSystem?> GetById(int id);
        public Task<ResponseConfigSystem?> GetAzureApiConfigByEnv(string appName, AppEnv env, string serviceName = "dynamic");
        public Task Update(ResponseConfigSystem azureConfig);
    }
}
