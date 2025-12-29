using Dapper;
using ResAuthApi.Application.Interfaces;
using ResAuthApi.Domain.Entities;

namespace ResAuthApi.Infrastructure.Persistence
{
    public class UserRepository : IUserRepository
    {
        private readonly MySqlConnectionFactory _factory;
        public UserRepository(MySqlConnectionFactory factory) => _factory = factory;

        public async Task<User?> GetByEmailAsync(string email)
        {
            const string sql = "SELECT * FROM users WHERE Email = @email LIMIT 1";
            using var db = _factory.Create();
            return await db.QueryFirstOrDefaultAsync<User>(sql, new { email });
        }

        public async Task AddAsync(User resUser)
        {
            const string sql = @"
                INSERT INTO users 
                (Email, Name, FirstName, LastName, AvatarUrl, CreatedBy, CreatedAt, Active)
                VALUES 
                (@Email, @Name, @FirstName, @LastName, @AvatarUrl, @CreatedBy, @CreatedAt, @Active)";
            using var db = _factory.Create();
            await db.ExecuteAsync(sql, resUser);
        }

        public async Task UpdateAsync(User resUser)
        {
            const string sql = @"
                    UPDATE users SET
                        Email = @Email,
                        Name = @Name,
                        FirstName = @FirstName,
                        LastName = @LastName,
                        AvatarUrl = @AvatarUrl,
                        Active = @Active
                    WHERE Id = @Id";
            using var db = _factory.Create();
            await db.ExecuteAsync(sql, resUser);
        }

        public async Task DeleteAsync(string email)
        {
            const string sql = @"DELETE FROM users WHERE Email = @Email";

            using var db = _factory.Create();
            await db.ExecuteAsync(sql, new { Email = email });
        }
    }
}
