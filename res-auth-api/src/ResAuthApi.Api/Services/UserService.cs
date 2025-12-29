using Microsoft.Extensions.Caching.Memory;
using ResAuthApi.Application.Interfaces;
using ResAuthApi.Domain.Entities;

namespace ResAuthApi.Api.Services
{
    public class UserService : IUserService
    {
        private readonly IUserRepository _repo;
        private readonly IMemoryCache _cache;
        public UserService(IUserRepository repo, IMemoryCache memoryCache)
        {
            _repo = repo;
            _cache = memoryCache;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email không được để trống.", nameof(email));

            var cacheKey = $"ResUser_Email_{email}";
            // Nếu đã có trong cache thì trả về luôn
            if (_cache.TryGetValue(cacheKey, out User? cachedUser))
            {
                return cachedUser;
            }

            // Nếu chưa có thì truy vấn từ DB và lưu vào cache
            var user = await _repo.GetByEmailAsync(email);

            if (user != null)
            {
                _cache.Set(cacheKey, user, TimeSpan.FromMinutes(10)); // Cache trong 10 phút
            }

            return user;
        }
        public async Task AddOrUpdateUserAsync(User resUser)
        {
            if (resUser == null)
                throw new ArgumentNullException(nameof(resUser));

            if (string.IsNullOrWhiteSpace(resUser.Email))
                throw new ArgumentException("Email không được để trống.", nameof(resUser.Email));

            var existingUser = await _repo.GetByEmailAsync(resUser.Email);
            if (existingUser != null)
            {
                await _repo.UpdateAsync(resUser);
            }
            else
            {
                await _repo.AddAsync(resUser);
            }                
        }       
       
    }
}
