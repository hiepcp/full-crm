using Microsoft.AspNetCore.Mvc;
using ResAuthApi.Api.Common;
using ResAuthZApi.Application.Interfaces.Services;

namespace ResAuthZApi.Api.Controllers
{
    [Microsoft.AspNetCore.Authorization.Authorize]
    [Route("api/authz")]
    [ApiController]
    public class AuthorizationController : ControllerBase
    {
        private readonly IAuthorizationService _authzService;
        private readonly IUserService _userService;
        public AuthorizationController(IAuthorizationService authzService, IUserService userService)
        {
            _authzService = authzService;
            _userService = userService;
        }

        [HttpGet("permissions")]
        public async Task<IActionResult> GetPermissions([FromQuery] string appCode = "CRMApi", string email = "thiennh@response.com.vn")
        {
            try
            {
                var permissions = await _userService.GetUserPermissionsAsync(appCode, email);
                return Ok(ApiResponse<IEnumerable<string>>.Ok(permissions, $"Get permissions of user {email} successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<IEnumerable<string>>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(500, ApiResponse<IEnumerable<string>>.Fail("Internal server error"));
            }
        }      

    }
}
