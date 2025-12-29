using ResAuthApi.Domain.Entities;

namespace ResAuthApi.Application.Interfaces
{
    public interface IUserService
    {
        Task<User?> GetByEmailAsync(string email);
        Task AddOrUpdateUserAsync(User resUser);
    }
}
