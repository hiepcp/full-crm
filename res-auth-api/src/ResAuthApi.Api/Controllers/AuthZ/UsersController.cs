using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResAuthApi.Api.Common;
using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;

namespace ResAuthZApi.Api.Controllers
{
    [Authorize]
    [Route("api/users")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        // GET: api/users
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<User>>.Ok(users, "Get all users successfully"));
        }

        [HttpGet("get-users-with-roles")]
        public async Task<IActionResult> GetAllUserWithRoleAsync(string appCode = "ComplApi", string email = "thiennh@response.com.vn")
        {
            var users = await _userService.GetAllUserWithRoleAsync(appCode, email);
            return Ok(ApiResponse<IEnumerable<UserDto>>.Ok(users, "Get all users successfully"));
        }

        // POST: api/users
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] UserCreateRequest request)
        {
            var userId = await _userService.CreateDtoAsync(request);
            return Ok(ApiResponse<int>.Ok(userId, "Created successfully"));
        }

        // PUT: api/users/{id}
        [HttpPut("{id}")]
        public async Task<IActionResult> Update(int id, [FromBody] UserUpdateRequest request)
        {
            await _userService.UpdateDtoAsync(id, request);
            return Ok(ApiResponse<string>.Ok("", "Created successfully"));
        }
    }
}
