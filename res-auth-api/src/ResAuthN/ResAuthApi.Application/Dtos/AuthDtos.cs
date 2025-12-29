namespace ResAuthApi.Application.DTOs
{
    public record RefreshResponse(string access_token, int expires_in);
}
