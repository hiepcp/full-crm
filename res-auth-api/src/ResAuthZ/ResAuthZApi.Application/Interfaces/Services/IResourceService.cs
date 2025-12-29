using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Domain.Entities;

namespace ResAuthZApi.Application.Interfaces.Services
{
    public interface IResourceService : IBaseService<Resource, int>
    {
        Task<ResourceResponse> CreateWithActionsAndPermissionsAsync(ResourceRequest request);
        Task<ResourceResponse> UpdateWithActionsAndPermissionsAsync(int id, ResourceRequest request);
    }
}
