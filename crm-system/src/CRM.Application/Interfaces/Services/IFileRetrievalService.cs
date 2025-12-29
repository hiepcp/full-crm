using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service for retrieving file URLs from SharePoint by IdRef
    /// </summary>
    public interface IFileRetrievalService
    {
        /// <summary>
        /// Get signed/temporary URL for file stored in SharePoint
        /// </summary>
        /// <param name="idRef">SharePoint file identifier</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>File URL response with signed URL and metadata</returns>
        /// <exception cref="FileNotFoundException">When file with IdRef not found</exception>
        /// <exception cref="UnauthorizedAccessException">When user lacks permission</exception>
        Task<FileUrlResponse> GetFileUrlAsync(string idRef, CancellationToken ct = default);

        /// <summary>
        /// Get file content stream from SharePoint (proxy method to bypass CORS)
        /// </summary>
        /// <param name="idRef">SharePoint file identifier</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Tuple of (Stream, ContentType, FileName)</returns>
        /// <exception cref="FileNotFoundException">When file with IdRef not found</exception>
        /// <exception cref="UnauthorizedAccessException">When user lacks permission</exception>
        Task<(Stream stream, string contentType, string fileName)> GetFileContentAsync(string idRef, CancellationToken ct = default);
    }
}
