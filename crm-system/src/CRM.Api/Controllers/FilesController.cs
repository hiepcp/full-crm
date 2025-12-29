using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for file operations (retrieve signed URLs for SharePoint files)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/files")]
    public class FilesController : ControllerBase
    {
        private readonly IFileRetrievalService _fileService;

        /// <summary>
        /// Init FilesController
        /// </summary>
        /// <param name="fileService"></param>
        public FilesController(IFileRetrievalService fileService)
        {
            _fileService = fileService;
        }

        /// <summary>
        /// Get signed/temporary URL for a file by its IdRef
        /// </summary>
        /// <param name="idRef">SharePoint file identifier</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Signed URL with expiration and metadata</returns>
        [HttpGet("{idRef}")]
        [ProducesResponseType(typeof(ApiResponse<FileUrlResponse>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status504GatewayTimeout)]
        public async Task<IActionResult> GetFileUrl(string idRef, CancellationToken ct)
        {
            try
            {
                // Get user email from JWT claims for audit logging
                var userEmail = User.Identity?.Name ?? "Unknown";
                Log.Information("[User: {UserEmail}] Requested file {IdRef}", userEmail, idRef);

                var result = await _fileService.GetFileUrlAsync(idRef, ct);

                Log.Information("[User: {UserEmail}] Requested file {IdRef} - Success", userEmail, idRef);
                return Ok(ApiResponse<FileUrlResponse>.Ok(result, "File URL retrieved successfully"));
            }
            catch (ArgumentException ex)
            {
                Log.Warning(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: Invalid format",
                    User.Identity?.Name ?? "Unknown", idRef);
                return BadRequest(ApiResponse<string>.Fail("Invalid IdRef format"));
            }
            catch (FileNotFoundException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: File not found",
                    User.Identity?.Name ?? "Unknown", idRef);
                return NotFound(ApiResponse<string>.Fail("File not found in SharePoint"));
            }
            catch (UnauthorizedAccessException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: Access denied",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<string>.Fail("Access denied"));
            }
            catch (TaskCanceledException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: Timeout",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status504GatewayTimeout,
                    ApiResponse<string>.Fail("Service timeout"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file {IdRef} - Failure: Unexpected error",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<string>.Fail($"Error retrieving file URL: {ex.Message}"));
            }
        }

        /// <summary>
        /// Proxy endpoint to stream file content from SharePoint
        /// This endpoint bypasses CORS and iframe restrictions by proxying the file through the backend
        /// </summary>
        /// <param name="idRef">SharePoint file identifier</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>File content stream with appropriate headers</returns>
        [HttpGet("{idRef}/content")]
        [ProducesResponseType(typeof(FileContentResult), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status403Forbidden)]
        [ProducesResponseType(typeof(ApiResponse<string>), StatusCodes.Status504GatewayTimeout)]
        public async Task<IActionResult> GetFileContent(string idRef, CancellationToken ct)
        {
            try
            {
                // Get user email from JWT claims for audit logging
                var userEmail = User.Identity?.Name ?? "Unknown";
                Log.Information("[User: {UserEmail}] Requested file content {IdRef}", userEmail, idRef);

                var (stream, contentType, fileName) = await _fileService.GetFileContentAsync(idRef, ct);

                Log.Information("[User: {UserEmail}] Requested file content {IdRef} - Success", userEmail, idRef);

                // Return file content with headers that allow iframe embedding
                return File(stream, contentType, fileName, enableRangeProcessing: true);
            }
            catch (ArgumentException ex)
            {
                Log.Warning(ex, "[User: {UserEmail}] Requested file content {IdRef} - Failure: Invalid format",
                    User.Identity?.Name ?? "Unknown", idRef);
                return BadRequest(ApiResponse<string>.Fail("Invalid IdRef format"));
            }
            catch (FileNotFoundException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file content {IdRef} - Failure: File not found",
                    User.Identity?.Name ?? "Unknown", idRef);
                return NotFound(ApiResponse<string>.Fail("File not found in SharePoint"));
            }
            catch (UnauthorizedAccessException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file content {IdRef} - Failure: Access denied",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status403Forbidden,
                    ApiResponse<string>.Fail("Access denied"));
            }
            catch (TaskCanceledException ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file content {IdRef} - Failure: Timeout",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status504GatewayTimeout,
                    ApiResponse<string>.Fail("Service timeout"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "[User: {UserEmail}] Requested file content {IdRef} - Failure: Unexpected error",
                    User.Identity?.Name ?? "Unknown", idRef);
                return StatusCode(StatusCodes.Status500InternalServerError,
                    ApiResponse<string>.Fail($"Error retrieving file content: {ex.Message}"));
            }
        }
    }
}
