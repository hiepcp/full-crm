using ResAuthApi.Application.Constants;
using ResAuthApi.Application.Interfaces;
using ResAuthApi.Domain.Entities;
using System.IdentityModel.Tokens.Jwt;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Text.Json;

namespace ResAuthApi.Api.Services
{
    public class AzureAdService : IAzureAdService
    {
        private readonly HttpClient _http;
        private readonly IConfiguration _cfg;

        public AzureAdService(IHttpClientFactory f, IConfiguration cfg)
        {
            _http = f.CreateClient();
            _cfg = cfg;
        }

        public async Task<string?> ExchangeCodeForIdToken(string code, string clientType = ClientTypes.Web)
        {
            var tenant = _cfg["AzureAd:TenantId"]!;
            var clientId = _cfg["AzureAd:ClientId"]!;
            var redirect = clientType == ClientTypes.Web
                                ? _cfg["AzureAd:RedirectUri"] ?? throw new InvalidOperationException("RedirectUri is missing in config")
                                : _cfg["AzureAd:RedirectUriMobile"] ?? throw new InvalidOperationException("RedirectUriMobile is missing in config");

            var clientSecret = _cfg["AzureAd:ClientSecret"]!;

            var tokEndpoint = $"https://login.microsoftonline.com/{tenant}/oauth2/v2.0/token";
            var form = new Dictionary<string, string>
            {
                ["client_id"] = clientId,
                ["scope"] = "openid profile email",
                ["code"] = code,
                ["redirect_uri"] = redirect,
                ["grant_type"] = "authorization_code",
                ["client_secret"] = clientSecret
            };

            var res = await _http.PostAsync(tokEndpoint, new FormUrlEncodedContent(form));
            if (!res.IsSuccessStatusCode) return null;

            var json = await res.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("id_token", out var idt))
                return idt.GetString();
            return null;
        }

        public IEnumerable<Claim> ExtractUserClaims(string idToken)
        {
            var handler = new JwtSecurityTokenHandler();
            handler.InboundClaimTypeMap.Clear();
            var jwt = handler.ReadJwtToken(idToken);

            var email =
                jwt.Claims.FirstOrDefault(c => c.Type == "email")?.Value
                ?? jwt.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
                ?? string.Empty;

            var name =
                jwt.Claims.FirstOrDefault(c => c.Type == "name")?.Value
                ?? $"{jwt.Claims.FirstOrDefault(c => c.Type == "given_name")?.Value} {jwt.Claims.FirstOrDefault(c => c.Type == "family_name")?.Value}".Trim();

            var sub = jwt.Claims.FirstOrDefault(c => c.Type == "sub")?.Value ?? string.Empty;

            var claims = new List<Claim>
            {
                new Claim("email", email),
                new Claim("name", name ?? email),
                new Claim("sub", sub)
            };
            return claims;
        }

        public User ExtractResUserFromToken(string idToken)
        {
            var handler = new JwtSecurityTokenHandler();
            handler.InboundClaimTypeMap.Clear();
            var jwt = handler.ReadJwtToken(idToken);

            string GetClaim(string type) =>
                jwt.Claims.FirstOrDefault(c => c.Type == type)?.Value ?? string.Empty;

            var user = new User
            {
                Email = GetClaim("email") != string.Empty ? GetClaim("email") : GetClaim("preferred_username"),
                Name = GetClaim("name") != string.Empty
                    ? GetClaim("name")
                    : $"{GetClaim("given_name")} {GetClaim("family_name")}".Trim(),
                FirstName = GetClaim("family_name"),
                LastName = GetClaim("given_name")
            };

            return user;
        }

        public async Task<byte[]> FetchUserAvatarAsync(string accessToken)
        {
            using var httpClient = new HttpClient();
            httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);

            var response = await httpClient.GetAsync("https://graph.microsoft.com/v1.0/me/photo/$value");
            return response.IsSuccessStatusCode ? await response.Content.ReadAsByteArrayAsync() : null;
        }

    }
}
