using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Shared.ExternalServices.Interfaces;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Service for retrieving file URLs from SharePoint
    /// </summary>
    public class FileRetrievalService : IFileRetrievalService
    {
        private readonly ISharepointService _sharepointService;
        private readonly ILogger<FileRetrievalService> _logger;

        public FileRetrievalService(
            ISharepointService sharepointService,
            ILogger<FileRetrievalService> logger)
        {
            _sharepointService = sharepointService;
            _logger = logger;
        }

        public async Task<FileUrlResponse> GetFileUrlAsync(string idRef, CancellationToken ct = default)
        {
            // Validate IdRef format
            if (string.IsNullOrWhiteSpace(idRef) || idRef.Length > 255)
            {
                _logger.LogWarning("Invalid IdRef format: {IdRef}", idRef);
                throw new ArgumentException("Invalid IdRef format", nameof(idRef));
            }

            try
            {
                _logger.LogInformation("Retrieving file URL for IdRef: {IdRef}", idRef);

                // Call SharePoint service to get file metadata (includes @microsoft.graph.downloadUrl)
                var fileInfo = await _sharepointService.ReadFileInfoAsync(idRef);

                if (fileInfo == null)
                {
                    throw new FileNotFoundException($"File not found for IdRef: {idRef}");
                }

                // Extract download URL from Graph API response
                var response = new FileUrlResponse
                {
                    Url = fileInfo.DownloadUrl ?? throw new InvalidOperationException("Download URL not found in file metadata"),
                    ExpiresAt = DateTime.UtcNow.AddHours(1), // Graph URLs expire in ~1 hour
                    ContentType = fileInfo.File?.MimeType ?? "application/octet-stream",
                    FileName = fileInfo.Name ?? "unknown",
                    Size = (long)fileInfo.Size
                };

                _logger.LogInformation("Successfully retrieved file URL for IdRef: {IdRef}", idRef);
                return response;
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogError(ex, "File not found for IdRef: {IdRef}", idRef);
                throw;
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Access denied for IdRef: {IdRef}", idRef);
                throw;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving file URL for IdRef: {IdRef}", idRef);
                throw new InvalidOperationException($"Failed to retrieve file URL: {ex.Message}", ex);
            }
        }

        public async Task<(Stream stream, string contentType, string fileName)> GetFileContentAsync(string idRef, CancellationToken ct = default)
        {
            // Validate IdRef format
            if (string.IsNullOrWhiteSpace(idRef) || idRef.Length > 255)
            {
                _logger.LogWarning("Invalid IdRef format: {IdRef}", idRef);
                throw new ArgumentException("Invalid IdRef format", nameof(idRef));
            }

            try
            {
                _logger.LogInformation("Retrieving file content for IdRef: {IdRef}", idRef);

                // First get file metadata to retrieve download URL
                var fileInfo = await _sharepointService.ReadFileInfoAsync(idRef);

                if (fileInfo == null)
                {
                    throw new FileNotFoundException($"File not found for IdRef: {idRef}");
                }

                var downloadUrl = fileInfo.DownloadUrl ?? throw new InvalidOperationException("Download URL not found in file metadata");
                var contentType = fileInfo.File?.MimeType ?? "application/octet-stream";
                var fileName = fileInfo.Name ?? "unknown";

                _logger.LogInformation("Downloading file content from URL for IdRef: {IdRef}", idRef);

                // Download file content from SharePoint using HttpClient
                using var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromMinutes(5); // 5 minute timeout for large files

                var response = await httpClient.GetAsync(downloadUrl, HttpCompletionOption.ResponseHeadersRead, ct);
                response.EnsureSuccessStatusCode();

                // Get the content stream (don't dispose it - the controller will handle disposal)
                var stream = await response.Content.ReadAsStreamAsync(ct);

                _logger.LogInformation("Successfully retrieved file content for IdRef: {IdRef}", idRef);
                return (stream, contentType, fileName);
            }
            catch (FileNotFoundException ex)
            {
                _logger.LogError(ex, "File not found for IdRef: {IdRef}", idRef);
                throw;
            }
            catch (UnauthorizedAccessException ex)
            {
                _logger.LogError(ex, "Access denied for IdRef: {IdRef}", idRef);
                throw;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "Error downloading file content for IdRef: {IdRef}", idRef);
                throw new InvalidOperationException($"Failed to download file content: {ex.Message}", ex);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving file content for IdRef: {IdRef}", idRef);
                throw new InvalidOperationException($"Failed to retrieve file content: {ex.Message}", ex);
            }
        }
    }
}
