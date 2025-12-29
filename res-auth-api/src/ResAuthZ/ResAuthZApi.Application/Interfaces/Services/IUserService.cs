using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Domain.Entities;

namespace ResAuthZApi.Application.Interfaces.Services;

public interface IUserService : IBaseService<User, int>
{
    Task<IEnumerable<UserDto>> GetAllUserWithRoleAsync(string appCode, string email, CancellationToken ct = default);
    Task<IEnumerable<string>> GetUserPermissionsAsync(string appCode, string email, CancellationToken ct = default);
    Task<int> CreateDtoAsync(UserCreateRequest request);
    Task UpdateDtoAsync(int userId, UserUpdateRequest request);    
}