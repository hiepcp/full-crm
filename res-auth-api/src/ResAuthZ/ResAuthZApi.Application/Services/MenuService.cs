using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;

namespace ResAuthZApi.Application.Services;

public class MenuService : BaseService<Menu, int>, IMenuService
{
    private readonly IMenuRepository _menuRepository;
    public MenuService(
            IRepository<Menu, int> repository,
            IUnitOfWork unitOfWork,
            IMenuRepository menuRepository
        ) : base(repository, unitOfWork)
    {
        _menuRepository = menuRepository;
    }

    public async Task<IEnumerable<Menu>> GetMenuOfUserAsync(string appCode, string email, CancellationToken ct = default)
    {
        var menus = await _menuRepository.GetMenuOfUserAsync(appCode, email, ct);
        return menus;
    }

    public async Task<IEnumerable<MenuDto>> GetMenuWithPermissionsOfUserAsync(string appCode, string email, CancellationToken ct = default)
    {
        var menus = await _menuRepository.GetMenuWithPermissionsOfUserAsync(appCode, email, ct);
        return menus;
    }

}