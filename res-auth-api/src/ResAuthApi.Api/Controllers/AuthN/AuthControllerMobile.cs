using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using ResAuthApi.Api.Hubs;
using ResAuthApi.Api.Utils;
using ResAuthApi.Application.Constants;
using ResAuthApi.Application.Interfaces;
using ResAuthApi.Domain.Entities;
using Serilog;
using System.Security.Claims;
using System.Text.Json;

namespace ResAuthApi.Api.Controllers.AuthN
{
    [Authorize]
    [Route("mobile")]
    [ApiController]
    public class AuthControllerMobile : ControllerBase
    {
        private readonly IAzureAdService _azureAdService;
        private readonly ITokenService _tokenService;
        private readonly IHubContext<LogoutHub> _hubContext;
        private readonly IConfiguration _cfg;
        private readonly int _tokenExpirationInSeconds;
        private readonly IUserService _resUserService;

        public AuthControllerMobile(IAzureAdService azureAdService, ITokenService tokenService, IConfiguration cfg, IHubContext<LogoutHub> hubContext, IUserService resUserService)
        {
            _azureAdService = azureAdService;
            _tokenService = tokenService;
            _hubContext = hubContext;
            _cfg = cfg;
            _tokenExpirationInSeconds = _cfg.GetValue<int?>("Jwt:AccessTokenExpirationInSeconds") ?? 3600;
            _resUserService = resUserService;
        }

        // 1. Mobile Login
        [AllowAnonymous]
        [HttpGet("signin-oidc")]
        public async Task<IActionResult> SignInMobile([FromQuery] string code)
        {
            if (string.IsNullOrEmpty(code))
                return BadRequest(new { error = "Code is missing" });

            var idToken = await _azureAdService.ExchangeCodeForIdToken(code, ClientTypes.Mobile);
            if (string.IsNullOrEmpty(idToken))
                return BadRequest(new { error = "No id_token" });

            var claims = _azureAdService.ExtractUserClaims(idToken).ToList();
            var email = claims.FirstOrDefault(c => c.Type == "email")?.Value;
            if (string.IsNullOrWhiteSpace(email))
                return BadRequest(new { error = "Email missing" });

            // Thêm user vào hệ thống bằng thread nền
            _ = Task.Run(async () =>
            {
                try
                {
                    var resUser = _azureAdService.ExtractResUserFromToken(idToken); // ánh xạ từ token sang model
                    var avatarBytes = await _azureAdService.FetchUserAvatarAsync(idToken);
                    if (avatarBytes?.Length > 0)
                    {
                        var avatarPath = await FileHelper.SaveUserAvatarAsync(email, avatarBytes);
                        resUser.AvatarUrl = avatarPath;
                    }
                    await _resUserService.AddOrUpdateUserAsync(resUser);
                    Log.Information("User {Email} added/updated in system", resUser.Email);
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "Failed to add/update user after Azure login");
                }
            });

            var accessToken = _tokenService.GenerateInternalToken(claims, expiresInSeconds: _tokenExpirationInSeconds);

            // Lưu refresh token cho mobile
            var refreshRaw = await _tokenService.CreateRefreshTokenAsync(
                email,
                TimeSpan.FromDays(7),
                HttpContext.Connection.RemoteIpAddress?.ToString(),
                Request.Headers["User-Agent"].ToString(),
                clientType: ClientTypes.Mobile
            );

            Log.Information("Mobile user {Email} logged in at {Time}", email, DateTime.Now);
           
            var payload = JsonSerializer.Serialize(new { access_token = accessToken, refresh_token = refreshRaw, expires_in = _tokenExpirationInSeconds });
            return Content($@"
                    <html><body>
                    <span id=""mySpan"">Hello World</span>
                    <script>
                      window.tokenData = {payload};                      
                    </script>
                    </body></html>", "text/html");
        }

        // 2. Mobile Refresh
        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> RefreshMobile([FromBody] RefreshMobileRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(new { error = "Missing refresh_token" });

            var tokenEntity = await _tokenService.FindByRawTokenAsync(request.RefreshToken);
            if (tokenEntity == null || tokenEntity.ExpiresAt < DateTime.Now || tokenEntity.RevokedAt != null || tokenEntity.IsRevoked)
                return BadRequest(new { error = "Invalid or expired refresh token" });

            // Rotate token
            tokenEntity.ClientType = ClientTypes.Mobile;
            var newRaw = await _tokenService.RotateAsync(tokenEntity, TimeSpan.FromDays(7));

            var claims = new[] { new Claim("email", tokenEntity.Email) };
            var newAccess = _tokenService.GenerateInternalToken(claims, expiresInSeconds: _tokenExpirationInSeconds);

            Log.Information("Mobile user {Email} refreshed token at {Time}", tokenEntity.Email, DateTime.Now);

            return Ok(new
            {
                access_token = newAccess,
                refresh_token = newRaw,
                expires_in = _tokenExpirationInSeconds
            });
        }

        // 3. Mobile Logout
        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<IActionResult> LogoutMobile([FromBody] LogoutMobileRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.RefreshToken))
                return BadRequest(new { error = "Missing refresh_token" });

            var tokenEntity = await _tokenService.FindByRawTokenAsync(request.RefreshToken);
            if (tokenEntity != null)
            {
                tokenEntity.IsRevoked = true;
                // 1. Revoke token hiện tại
                await _tokenService.RevokeAsync(tokenEntity, "logout");

                // 2. Gửi SignalR thông báo logout toàn bộ mobile
                await _hubContext.Clients
                    .Group($"{tokenEntity.Email}:mobile") // Nhóm kết nối theo email
                    .SendAsync("Logout", new { reason = "User requested logout" });

                Log.Information("Mobile user {Email} logged out at {Time}", tokenEntity.Email, DateTime.Now);
            }

            Log.Warning("Mobile user {Email} logout with refreshed token: {refreshToken} not in database!", request.RefreshToken);

            return Ok(new { message = "Logged out successfully" });
        }
    }

    // DTO request model
    public class RefreshMobileRequest
    {
        public string RefreshToken { get; set; }
    }

    public class LogoutMobileRequest
    {
        public string RefreshToken { get; set; }
    }
}