using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ResAuthApi.Api.Services;
using ResAuthApi.Api.Utils;
using ResAuthApi.Application.Constants;
using ResAuthApi.Application.Interfaces;

namespace ResAuthApi.Api.Controllers.AuthN
{
    [Route("")]
    [ApiController]
    public class AzureTokenController : ControllerBase
    {
        private readonly IAzureTokenService _tokenService;
        private readonly ILogger<AzureTokenController> _logger;

        public AzureTokenController(IAzureTokenService tokenService, ILogger<AzureTokenController> logger)
        {
            _tokenService = tokenService;
            _logger = logger;
        }

        /// <summary>
        /// Lấy access_token từ Azure AD cho env + serviceName
        /// </summary>
        [HttpGet("{appName}/{env}/{serviceName}")]
        public async Task<IActionResult> GetToken(string appName = "ResAuthApi", AppEnv env = AppEnv.Dev, string serviceName = "dynamics")
        {
            try
            {
                if (!Enum.IsDefined(typeof(AppEnv), env))
                {
                    return BadRequest(new { message = $"Invalid env value. Allowed: {string.Join(", ", Enum.GetNames(typeof(Environment)))}" });
                }

                if (serviceName != ServiceNames.Dynamics &&
                    serviceName != ServiceNames.SharePoint &&
                    serviceName != ServiceNames.GraphBased)
                {
                    return BadRequest(new { message = "Invalid serviceName" });
                }

                var token = await _tokenService.GetAccessTokenByEnv(appName, env, serviceName ?? "dynamic");

                if (string.IsNullOrEmpty(token))
                    return NotFound(new { message = "Token not found" });

                // Không nên trả raw token trong log/response production (chỉ trả cho FE khi thực sự cần)
                return Ok(new
                {
                    access_token = token,
                    length = token.Length
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error while getting Azure access token for env={Env}, service={Service}", env, serviceName);
                return StatusCode(500, new { message = "Failed to retrieve token", error = ex.Message });
            }
        }

    }
}
