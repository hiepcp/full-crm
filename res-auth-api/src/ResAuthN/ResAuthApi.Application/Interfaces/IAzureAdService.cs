using ResAuthApi.Application.Constants;
using ResAuthApi.Domain.Entities;
using System.Security.Claims;

namespace ResAuthApi.Application.Interfaces
{
    public interface IAzureAdService
    {
        Task<string?> ExchangeCodeForIdToken(string code, string clientType = ClientTypes.Web);
        IEnumerable<Claim> ExtractUserClaims(string idToken);
        User ExtractResUserFromToken(string idToken);
        Task<byte[]> FetchUserAvatarAsync(string accessToken);
    }
}
