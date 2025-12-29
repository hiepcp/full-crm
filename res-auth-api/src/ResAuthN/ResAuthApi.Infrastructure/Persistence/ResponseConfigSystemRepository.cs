using Dapper;
using Microsoft.Extensions.Logging;
using ResAuthApi.Application.Constants;
using ResAuthApi.Application.Interfaces;
using ResAuthApi.Domain.Entities;
using System.Data;

namespace ResAuthApi.Infrastructure.Persistence
{
    public class ResponseConfigSystemRepository : IResponseConfigSystemRepository
    {
        private readonly MySqlConnectionFactory _factory;
        private readonly ILogger<ResponseConfigSystemRepository> _logger;
        public ResponseConfigSystemRepository(MySqlConnectionFactory factory, ILogger<ResponseConfigSystemRepository> logger)
        {
            _factory = factory;
            _logger = logger;
        }

        public async Task<IEnumerable<ResponseConfigSystem>> GetAll()
        {
            try
            {
                using var connection = _factory.Create();
                return await connection.QueryAsync<ResponseConfigSystem>(
                    "sp_get_all_response_config_system",
                    commandType: CommandType.StoredProcedure
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "An unexpected error occurred while fetching all dynamics settings");
                throw;
            }
        }

        public async Task<ResponseConfigSystem> GetById(int id)
        {
            try
            {
                using var connection = _factory.Create();
                var parameters = new { p_Id = id };

                var result = await connection.QuerySingleOrDefaultAsync<ResponseConfigSystem>(
                    "sp_get_response_config_system_by_id",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );

                if (result == null)
                {
                    throw new InvalidOperationException($"AzureApiConfig with ID {id} was not found.");
                }

                return result;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An unexpected error occurred while fetching dynamics settings with ID {id}");
                throw;
            }
        }

        public async Task<ResponseConfigSystem?> GetAzureApiConfigByEnv(string appName, AppEnv env, string serviceName = "dynamic")
        {
            try
            {
                using var connection = _factory.Create(); 

                return await connection.QuerySingleOrDefaultAsync<ResponseConfigSystem>(
                    "sp_get_response_config_system_by_env",
                    new { p_AppName = appName, p_Env = env, p_ServiceName = serviceName },
                    commandType: CommandType.StoredProcedure
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An unexpected error occurred while fetching dynamics settings with environment {appName} {env} {serviceName}");
                throw;
            }
        }

        public async Task Update(ResponseConfigSystem azureConfig)
        {
            try
            {
                using var connection = _factory.Create();

                var parameters = new
                {
                    p_Id = azureConfig.Id,
                    p_AccessToken = azureConfig.AccessToken,
                    p_TokenExpiry = azureConfig.TokenExpiry
                };

                await connection.ExecuteAsync(
                    "sp_update_token_response_config_system",
                    parameters,
                    commandType: CommandType.StoredProcedure
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"An unexpected error occurred while updating dynamics settings with ID {azureConfig.Id}");
                throw;
            }
        }
    }
}
