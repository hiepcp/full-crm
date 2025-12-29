using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IUserService
    {
        Task<PagedResult<UserResponse>> QueryAsync(UserQueryRequest request, CancellationToken ct = default);
        Task<UserResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<UserResponse?> GetByEmailAsync(string email, CancellationToken ct = default);
        Task<long> CreateAsync(CreateUserRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateUserRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
    }
}
