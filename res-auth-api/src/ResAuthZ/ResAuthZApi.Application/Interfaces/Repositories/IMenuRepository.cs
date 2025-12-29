using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Domain.Entities;

namespace ResAuthZApi.Application.Interfaces.Repositories
{
    public interface IMenuRepository
    {
        Task<IEnumerable<Menu>> GetMenuOfUserAsync(string appCode, string email, CancellationToken ct = default);
        Task<IEnumerable<MenuDto>> GetMenuWithPermissionsOfUserAsync(string appCode, string email, CancellationToken ct = default);
    }
}
