using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using FluentValidation.Results;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Serilog;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// User service implementation with business logic
    /// </summary>
    public class UserService : BaseService<User, long, CreateUserRequest>, IUserService
    {
        private readonly IUserRepository _userRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateUserRequest> _createValidator;
        private readonly IValidator<UpdateUserRequest> _updateValidator;

        public UserService(
            IRepository<User, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateUserRequest> createValidator,
            IValidator<UpdateUserRequest> updateValidator,
            IUserRepository userRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _userRepository = userRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        /// <summary>
        /// Query users with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<UserResponse>> QueryAsync(UserQueryRequest request, CancellationToken ct = default)
        {
            var result = await _userRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<UserResponse>>(result.Items);

            return new PagedResult<UserResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        public new async Task<UserResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var user = await base.GetByIdAsync(id, ct);
                return _mapper.Map<UserResponse>(user);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        public async Task<UserResponse?> GetByEmailAsync(string email, CancellationToken ct = default)
        {
            try
            {
                var user = await _userRepository.GetByEmailAsync(email, ct);
                return _mapper.Map<UserResponse>(user);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Create new user with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateUserRequest request, string userEmail, CancellationToken ct = default)
        {
            // Additional business validation
            if (string.IsNullOrWhiteSpace(request.Email))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Email), "User email is required.")
                });
            }

            // Business rules validation
            if (!request.Email.Contains("@"))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Email), "Invalid email format.")
                });
            }

            if (!string.IsNullOrEmpty(request.FirstName) && string.IsNullOrWhiteSpace(request.FirstName))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.FirstName), "First name cannot be empty if provided.")
                });
            }

            if (!string.IsNullOrEmpty(request.LastName) && string.IsNullOrWhiteSpace(request.LastName))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.LastName), "Last name cannot be empty if provided.")
                });
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing user
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateUserRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Additional business validation
            if (!string.IsNullOrEmpty(request.Email) && !request.Email.Contains("@"))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Email), "Invalid email format.")
                });
            }

            if (!string.IsNullOrEmpty(request.FirstName) && string.IsNullOrWhiteSpace(request.FirstName))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.FirstName), "First name cannot be empty if provided.")
                });
            }

            if (!string.IsNullOrEmpty(request.LastName) && string.IsNullOrWhiteSpace(request.LastName))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.LastName), "Last name cannot be empty if provided.")
                });
            }

            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreateUserRequest>(request), userEmail, ct);
                return true;
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
            catch
            {
                throw;
            }
        }

        /// <summary>
        /// Delete user by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var user = await GetByIdAsync(id);
            if (user == null)
                return false;

            // Business rule: Don't delete active users
            if (user.IsActive)
            {
                throw new InvalidOperationException("Cannot delete an active user. Deactivate first.");
            }

            try
            {
                await base.DeleteAsync(id, userEmail);
                return true;
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
        }
    }
}
