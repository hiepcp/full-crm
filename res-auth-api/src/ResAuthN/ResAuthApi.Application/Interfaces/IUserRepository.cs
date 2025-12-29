using ResAuthApi.Domain.Entities;

namespace ResAuthApi.Application.Interfaces
{
    public interface IUserRepository
    {
        Task<User?> GetByEmailAsync(string email);
        Task AddAsync(User resUser);        
        Task UpdateAsync(User resUser);
        Task DeleteAsync(string email);
    }
}
