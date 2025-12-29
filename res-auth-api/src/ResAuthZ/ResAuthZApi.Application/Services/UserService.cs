using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Repositories;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Interfaces;
using System.Transactions;

namespace ResAuthZApi.Application.Services;

public class UserService : BaseService<User, int>, IUserService
{
    private readonly IUnitOfWork _uow;
    private readonly IUserRepository _userRepository;
    private readonly IRepository<UserRole, int> _userRoleRepositoryBase;
    public UserService(
            IRepository<User, int> repositoryBase,
            IUnitOfWork unitOfWork,
            IUserRepository userRepository,
            IRepository<UserRole, int> userRoleRepositoryBase
        ) : base(repositoryBase, unitOfWork)
    {
        _uow = unitOfWork;
        _userRepository = userRepository;
        _userRoleRepositoryBase = userRoleRepositoryBase;
    }

    public async Task<int> CreateDtoAsync(UserCreateRequest request)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            // Insert user, get new userId
            var user = new User
            {
                Email = request.Email,
                UserName = request.UserName ?? "",
                FullName = request.FullName
            };
            var userId = await base.AddAsync(user);

            // Insert user roles
            foreach (var roleId in request.RoleIds)
            {
                var role = new UserRole
                {
                    UserId = userId,
                    RoleId = roleId
                };

                await _userRoleRepositoryBase.AddAsync(role);
            }

            await _uow.CommitAsync();
            return userId;
        }
        catch
        {
            await _uow.RollbackAsync();
            throw;
        }
    }
    public async Task UpdateDtoAsync(int userId, UserUpdateRequest request)
    {
        await _uow.BeginTransactionAsync();
        try
        {
            // Update user info
            var user = await base.GetByIdAsync(userId);
            if (user == null) throw new Exception("User not found");
            user.FullName = request.FullName;
            user.UserName = request.UserName ?? "";
            await base.UpdateAsync(user);

            // Remove old roles and add new ones
            await _userRepository.DeleteUserRolesAsync(userId);
            foreach (var roleId in request.RoleIds)
            {
                var role = new UserRole
                {
                    UserId = userId,
                    RoleId = roleId
                };

                await _userRoleRepositoryBase.AddAsync(role);
            }

            await _uow.CommitAsync();
        }
        catch
        {
            await _uow.RollbackAsync();
            throw;
        }
    }

    public async Task<IEnumerable<UserDto>> GetAllUserWithRoleAsync(string appCode, string email, CancellationToken ct = default)
    {
        var users = await _userRepository.GetAllUserWithRoleAsync(appCode, email, ct);
        return users;
    }

    public async Task<IEnumerable<string>> GetUserPermissionsAsync(string appCode, string email, CancellationToken ct = default)
    {
        var permissions = await _userRepository.GetUserPermissionsAsync(appCode, email, ct);
        return permissions;
    }
}