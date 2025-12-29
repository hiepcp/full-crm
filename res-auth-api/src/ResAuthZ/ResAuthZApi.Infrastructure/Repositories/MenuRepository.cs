using Dapper;
using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;
using System.Data;
using System.Text.Json;

namespace ResAuthZApi.Infrastructure.Repositories
{
    public class MenuRepository : DapperRepository<Menu, int>, IMenuRepository
    {
        public MenuRepository(IUnitOfWork unitOfWork)
        : base(unitOfWork) { }

        public async Task<IEnumerable<Menu>> GetMenuOfUserAsync(string appCode, string email, CancellationToken ct = default)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@p_email", email);
            parameters.Add("@p_appCode", appCode);

            var result = await Connection.QueryAsync<Menu>(
                "sp_get_user_menus",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result ?? Enumerable.Empty<Menu>();
        }

        public async Task<IEnumerable<MenuDto>> GetMenuWithPermissionsOfUserAsync(string appCode, string email, CancellationToken ct = default)
        {
            try
            {
                var menus = Connection.Query<MenuDto>(
                    "sp_get_user_menus_with_permissions",
                    new { p_appCode = appCode, p_email = email },
                    commandType: CommandType.StoredProcedure
                ).ToList();
                
                return menus ?? Enumerable.Empty<MenuDto>();
            }
            catch (Exception ex)
            {
                throw;
            }
        }

    }
}
