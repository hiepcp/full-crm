using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Domain.Entities;

namespace ResAuthZApi.Application.Interfaces.Services
{
    public interface IMenuService : IBaseService<Menu, int>
    {
        Task<IEnumerable<Menu>> GetMenuOfUserAsync(string appCode, string email, CancellationToken ct = default);
        Task<IEnumerable<MenuDto>> GetMenuWithPermissionsOfUserAsync(string appCode, string email, CancellationToken ct = default);
    }
}
