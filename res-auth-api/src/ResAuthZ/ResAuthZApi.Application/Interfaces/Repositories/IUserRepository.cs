using ResAuthZApi.Application.Dtos;

namespace ResAuthZApi.Application.Interfaces.Repositories
{
    public interface IUserRepository
    {
        Task<IEnumerable<UserDto>> GetAllUserWithRoleAsync(string appCode, string email, CancellationToken ct = default);

        Task DeleteUserRolesAsync(int userId);

        Task<IEnumerable<string>> GetUserPermissionsAsync(string appCode, string email, CancellationToken ct = default);
    }
}
