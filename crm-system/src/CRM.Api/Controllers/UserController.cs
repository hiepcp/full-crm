using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.Dapper.Models;
using Shared.AuthN.Common;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Users (CRM Users management)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/users")]
    public class UserController : ControllerBase
    {
        private readonly IUserService _userService;

        /// <summary>
        /// Init UserController
        /// </summary>
        /// <param name="userService"></param>
        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        /// <summary>
        /// Query users with pagination and filtering
        /// </summary>
        /// <param name="request">User query parameters including pagination, filters and sorting</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of users</returns>
        /// <response code="200">Successfully returned List of users</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        public async Task<IActionResult> GetUsers([FromQuery] UserQueryRequest request, CancellationToken ct = default)
        {
            try
            {
                var result = await _userService.QueryAsync(request, ct);
                return Ok(ApiResponse<PagedResult<UserResponse>>.Ok(result, "Users retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error querying users");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        /// <param name="id">User ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>user</returns>
        /// <response code="200">Successfully returned user details</response>
        /// <response code="404">user</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("{id:long}")]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                var user = await _userService.GetByIdAsync(id, ct);
                if (user == null)
                    return NotFound(ApiResponse<string>.Fail($"User with ID {id} was not found"));

                return Ok(ApiResponse<UserResponse>.Ok(user, "User retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting user by id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get user by Email
        /// </summary>
        /// <param name="email"></param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>user</returns>
        /// <response code="200">Successfully returned user details</response>
        /// <response code="404">user</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("email/{email}")]
        public async Task<IActionResult> GetByEmail(string email, CancellationToken ct = default)
        {
            try
            {
                var user = await _userService.GetByEmailAsync(email, ct);
                if (user == null)
                    return NotFound(ApiResponse<string>.Fail($"User with Email {email} was not found"));

                return Ok(ApiResponse<UserResponse>.Ok(user, "User retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting user by email: {Email}", email);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new user
        /// </summary>
        /// <param name="request">user information to create</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>ID of the created user</returns>
        /// <response code="201">Successfully created user, returns ID</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CreateUserRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _userService.CreateAsync(request, userEmail, ct);
                return CreatedAtAction(nameof(GetById), new { id }, ApiResponse<long>.Ok(id, "User created successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating user");
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update user
        /// </summary>
        /// <param name="id">User ID to update</param>
        /// <param name="request">user information to update</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Update result</returns>
        /// <response code="200">Update user thành công</response>
        /// <response code="404">user</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPut("{id:long}")]
        public async Task<IActionResult> Update(long id, [FromBody] UpdateUserRequest request, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _userService.UpdateAsync(id, request, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"User with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "User updated successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating user with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete user
        /// </summary>
        /// <param name="id">User ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Deletion result</returns>
        /// <response code="200">Delete user thành công</response>
        /// <response code="404">user</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("{id:long}")]
        public async Task<IActionResult> Delete(long id, CancellationToken ct = default)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var success = await _userService.DeleteAsync(id, userEmail, ct);
                if (!success)
                    return NotFound(ApiResponse<string>.Fail($"User with ID {id} was not found"));

                return Ok(ApiResponse<string>.Ok("", "User deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting user with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail($"Error: {ex.Message}"));
            }
        }
    }
}
