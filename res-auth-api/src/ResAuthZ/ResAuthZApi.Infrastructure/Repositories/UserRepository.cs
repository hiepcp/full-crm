using Dapper;
using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Repositories;
using System.Data;

namespace ResAuthZApi.Infrastructure.Repositories
{
    public class UserRepository : DapperRepository<User, int>, IUserRepository
    {
        public UserRepository(IUnitOfWork unitOfWork)
        : base(unitOfWork) { }

        public async Task DeleteUserRolesAsync(int userId)
        {
            const string sql = @"DELETE FROM user_roles WHERE UserId = @userId";
            await Connection.ExecuteAsync(sql, new { userId }, Transaction);
        }

        public async Task<IEnumerable<UserDto>> GetAllUserWithRoleAsync(string appCode, string email, CancellationToken ct = default)
        {
            var sql = @"
            SELECT DISTINCT u.UserId, u.Email, u.UserName,
                   r.RoleId, r.Name AS RoleName
            FROM users u
            LEFT JOIN user_roles ur ON u.UserId = ur.UserId
            LEFT JOIN roles r ON ur.RoleId = r.RoleId
            LEFT JOIN applications a ON a.AppId = r.AppId
            WHERE a.AppCode = @appCode
            ORDER BY u.UserId";

            var dict = new Dictionary<int, UserDto>();

            var rows = await Connection.QueryAsync<UserDto, int?, string?, UserDto>(
                sql,
                (user, roleId, roleName) =>
                {
                    if (!dict.TryGetValue(user.UserId, out var entry))
                    {
                        entry = user;
                        entry.Roles = new List<string>();
                        dict[user.UserId] = entry;
                    }
                    if (roleName != null)
                        entry.Roles.Add(roleName);

                    return entry;
                },
                new { appCode },
                splitOn: "RoleId,RoleName"
            );

            return dict.Values;
        }

        public async Task<IEnumerable<string>> GetUserPermissionsAsync(string appCode, string email, CancellationToken ct = default)
        {
            var parameters = new DynamicParameters();
            parameters.Add("@p_email", email);
            parameters.Add("@p_appCode", appCode);

            var result = await Connection.QueryAsync<string>(
                "sp_get_user_permissions",
                parameters,
                commandType: CommandType.StoredProcedure
            );

            return result ?? Enumerable.Empty<string>();
        }
    }
}
