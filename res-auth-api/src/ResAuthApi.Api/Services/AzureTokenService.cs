using Microsoft.Extensions.Caching.Memory;
using Polly;
using Polly.Retry;
using ResAuthApi.Api.Utils;
using ResAuthApi.Application.Constants;
using ResAuthApi.Application.Interfaces;
using ResAuthApi.Domain.Entities;
using System.Text.Json;

namespace ResAuthApi.Api.Services
{
    public class AzureTokenService : IAzureTokenService
    {

        private readonly IResponseConfigSystemRepository _azureApiConfig;
        private readonly ILogger<AzureTokenService> _logger;
        private readonly AsyncRetryPolicy _retryPolicy;
        private readonly HttpClient _client;

        public AzureTokenService(IResponseConfigSystemRepository azureApiConfig, ILogger<AzureTokenService> logger, HttpClient client)
        {
            _azureApiConfig = azureApiConfig;
            _logger = logger;
            _client = client;
            // Initialize retry policy with exponential backoff
            _retryPolicy = Policy
                .Handle<HttpRequestException>()
                .Or<TaskCanceledException>()
                .Or<TimeoutException>()
                .WaitAndRetryAsync(
                    3, // Number of retry attempts
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)), // Exponential backoff
                    (exception, timeSpan, retryCount, context) =>
                    {
                        _logger.LogWarning(exception,
                            "Error connecting to authentication service. Retrying in {RetryTimeSpan}s (Attempt {RetryCount} of 3)",
                            timeSpan.TotalSeconds, retryCount);
                    });
        }

        public async Task<string?> GetAccessTokenByEnv(string appName, AppEnv env, string serviceName = "dynamic")
        {
            try
            {
                var config = await _azureApiConfig.GetAzureApiConfigByEnv(appName, env, serviceName);
                if (config == null)
                {
                    _logger.LogWarning("No Azure API config found for appName={appName} env={Env}, service={Service}", appName, env, serviceName);
                    return null;
                }

                // check token còn hạn không
                if (config.TokenExpiry.HasValue && !this.IsTokenExpired(config.TokenExpiry.Value))
                {
                    return config.AccessToken;
                }

                return await _retryPolicy.ExecuteAsync(async () =>
                {
                    var adAuthParameters = new Dictionary<string, string>
                    {
                        { "grant_type", config.GrantType },
                        { "client_id", config.ClientId }, //EncryptData.Decrypt(config.ClientId) },
                        { "client_secret", EncryptData.Decrypt(config.ClientSecret) },
                        { "scope", config.Scope }
                    };

                    var url = $"{config.AuthUrl}/{config.TenantId}/oauth2/v2.0/token";
                    _logger.LogInformation("Requesting access token from {AuthUrl}", url);

                    using var tokenRequestContent = new FormUrlEncodedContent(adAuthParameters);
                    using var tokenResponse = await _client.PostAsync(url, tokenRequestContent);

                    if (!tokenResponse.IsSuccessStatusCode)
                    {
                        string errorMessage = await tokenResponse.Content.ReadAsStringAsync();
                        _logger.LogError(
                            "Token request failed with status code {StatusCode}. Error message: {ErrorMessage}",
                            (int)tokenResponse.StatusCode, errorMessage
                        );
                        throw new HttpRequestException(
                            $"Token request failed with status code {(int)tokenResponse.StatusCode}. Error message: {errorMessage}"
                        );
                    }

                    var tokenResponseContent = await tokenResponse.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(tokenResponseContent);
                    if (!doc.RootElement.TryGetProperty("access_token", out var accessTokenElement))
                    {
                        _logger.LogError("Token response does not contain 'access_token'. Response: {Response}", tokenResponseContent);
                        throw new InvalidOperationException("Token response missing 'access_token'");
                    }

                    string accessToken = accessTokenElement.GetString() ?? string.Empty;
                    int expiresIn = doc.RootElement.TryGetProperty("expires_in", out var expiresElement)
                                                    ? expiresElement.GetInt32()
                                                    : 3600;

                    config.AccessToken = accessToken;
                    config.TokenExpiry = DateTimeOffset.UtcNow.ToUnixTimeSeconds() + expiresIn - 120; // trừ 2 phút;

                    await _azureApiConfig.Update(config);

                    _logger.LogInformation("Successfully retrieved access token (length={Length})", accessToken.Length);

                    return accessToken;
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to get access token after multiple attempts");
                throw;
            }
        }

        private bool IsTokenExpired(long token_expiry)
        {

            if (token_expiry == 0)
                return true;
            return DateTimeOffset.UtcNow.ToUnixTimeSeconds() > token_expiry;
        }
    }
}
