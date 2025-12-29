using Dapper;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;

namespace ResAuthZApi.Infrastructure.Repositories
{
    public class ResourceActionRepository : DapperRepository<ResourceAction, int>, IResourceActionRepository
    {

    public ResourceActionRepository(IUnitOfWork unitOfWork) : base(unitOfWork) { }

        public async Task AddResourceActionAsync(int resourceId, int actionId)
        {
            const string sql = @"
            INSERT INTO resource_actions 
            (ResourceId, ActionId)
            VALUES 
            (@resourceId, @actionId)";
            await Connection.ExecuteAsync(sql, new { resourceId, actionId }, Transaction);
        }

        public async Task DeleteByResourceIdAsync(int resourceId)
        {
            const string sql = @"DELETE FROM resource_actions WHERE ResourceId = @resourceId";            
            await Connection.ExecuteAsync(sql, new { resourceId }, Transaction);
        }
              
    }
}
