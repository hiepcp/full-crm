using CRM.Api.Utils;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing Dynamics 365 category synchronization
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/dynamics365sync")]
    public class Dynamics365SyncController : ControllerBase
    {
        private readonly IDynamics365CategorySyncService _syncService;

        /// <summary>
        /// Init Dynamics365SyncController
        /// </summary>
        /// <param name="syncService">Dynamics 365 category sync service</param>
        public Dynamics365SyncController(IDynamics365CategorySyncService syncService)
        {
            _syncService = syncService;
        }

        /// <summary>
        /// Trigger manual synchronization between CRM and Dynamics 365
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Sync operation ID</returns>
        /// <response code="200">Successfully triggered sync operation</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost("trigger")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> TriggerManualSync(CancellationToken ct = default)
        {
            try
            {
                Log.Information("TriggerManualSync - Processing manual sync trigger request");

                var userEmail = User.FindFirst(UserClaimTypes.Email)?.Value ?? "unknown";
                Log.Information("TriggerManualSync - Triggered by user: {UserEmail}", userEmail);

                var syncId = await _syncService.TriggerManualSyncAsync(userEmail, ct);

                Log.Information("TriggerManualSync - Successfully triggered sync with ID: {SyncId}", syncId);
                return Ok(ApiResponse<object>.Ok(
                    new { status = "started", syncId },
                    "Sync operation started successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "TriggerManualSync - Error triggering manual sync");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while triggering sync: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get current synchronization status
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Sync status information including last sync time, status, and next scheduled sync</returns>
        /// <response code="200">Successfully returned sync status</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("status")]
        [ProducesResponseType(typeof(ApiResponse<SyncStatusDto>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetSyncStatus(CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetSyncStatus - Processing sync status request");

                var status = await _syncService.GetSyncStatusAsync(ct);

                Log.Information("GetSyncStatus - Successfully retrieved sync status. Last sync: {LastSyncTime}, Status: {SyncStatus}",
                    status.LastSyncTime, status.SyncStatus);
                return Ok(ApiResponse<SyncStatusDto>.Ok(status, "Sync status retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetSyncStatus - Error retrieving sync status");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving sync status: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get paginated audit log entries for sync operations
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Records per page (default: 20, max: 100)</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of audit log entries</returns>
        /// <response code="200">Successfully returned audit log entries</response>
        /// <response code="400">Invalid request parameters</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("audit")]
        [ProducesResponseType(typeof(ApiResponse<PaginatedResult<CategorySyncAuditLog>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetAuditLog(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetAuditLog - Processing audit log request for page {Page}, pageSize {PageSize}",
                    page, pageSize);

                if (page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (pageSize < 1 || pageSize > 100)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be between 1 and 100"));

                var auditLog = await _syncService.GetAuditLogAsync(page, pageSize, ct);

                Log.Information("GetAuditLog - Retrieved page {Page}. Total records: {TotalCount}",
                    page, auditLog.TotalCount);
                return Ok(ApiResponse<PaginatedResult<CategorySyncAuditLog>>.Ok(
                    auditLog,
                    $"Retrieved page {page} of audit log successfully. Total records: {auditLog.TotalCount}"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetAuditLog - Error retrieving audit log");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving audit log: {ex.Message}"));
            }
        }

        /// <summary>
        /// Get all category mappings between CRM and Dynamics 365
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of category mappings</returns>
        /// <response code="200">Successfully returned category mappings</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("mappings")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<CategoryMapping>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetCategoryMappings(CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetCategoryMappings - Processing category mappings request");

                var mappings = await _syncService.GetCategoryMappingsAsync(ct);

                Log.Information("GetCategoryMappings - Successfully retrieved {Count} category mappings",
                    mappings.Count());
                return Ok(ApiResponse<IEnumerable<CategoryMapping>>.Ok(
                    mappings,
                    "Category mappings retrieved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetCategoryMappings - Error retrieving category mappings");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving category mappings: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create or update a category mapping
        /// </summary>
        /// <param name="mapping">Category mapping to save</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Saved mapping ID</returns>
        /// <response code="200">Successfully saved category mapping</response>
        /// <response code="400">Invalid mapping data</response>
        /// <response code="500">Server error while processing request</response>
        [HttpPost("mappings")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> SaveCategoryMapping(
            [FromBody] CategoryMapping mapping,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("SaveCategoryMapping - Processing save category mapping request");

                if (mapping == null)
                    return BadRequest(ApiResponse<string>.Fail("Mapping data is required"));

                if (string.IsNullOrWhiteSpace(mapping.CRMCategoryName) &&
                    string.IsNullOrWhiteSpace(mapping.Dynamics365CategoryName))
                    return BadRequest(ApiResponse<string>.Fail(
                        "At least one category name (CRM or Dynamics 365) is required"));

                var mappingId = await _syncService.SaveCategoryMappingAsync(mapping, ct);

                Log.Information("SaveCategoryMapping - Successfully saved category mapping with ID: {MappingId}",
                    mappingId);
                return Ok(ApiResponse<object>.Ok(
                    new { mappingId },
                    "Category mapping saved successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "SaveCategoryMapping - Error saving category mapping");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while saving category mapping: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete a category mapping
        /// </summary>
        /// <param name="id">Mapping ID to delete</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Success status</returns>
        /// <response code="200">Successfully deleted category mapping</response>
        /// <response code="404">Mapping not found</response>
        /// <response code="500">Server error while processing request</response>
        [HttpDelete("mappings/{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> DeleteCategoryMapping(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("DeleteCategoryMapping - Processing delete category mapping request for ID: {Id}", id);

                var deleted = await _syncService.DeleteCategoryMappingAsync(id, ct);

                if (!deleted)
                {
                    Log.Warning("DeleteCategoryMapping - Mapping not found for ID: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Mapping with ID {id} was not found"));
                }

                Log.Information("DeleteCategoryMapping - Successfully deleted category mapping with ID: {Id}", id);
                return Ok(ApiResponse<bool>.Ok(true, "Category mapping deleted successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "DeleteCategoryMapping - Error deleting category mapping with ID: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while deleting category mapping: {ex.Message}"));
            }
        }

        /// <summary>
        /// Validate sync configuration and Dynamics 365 connectivity
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Configuration validation result</returns>
        /// <response code="200">Configuration is valid and D365 is reachable</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("validate")]
        [ProducesResponseType(typeof(ApiResponse<object>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> ValidateConfiguration(CancellationToken ct = default)
        {
            try
            {
                Log.Information("ValidateConfiguration - Processing configuration validation request");

                var isValid = await _syncService.ValidateConfigurationAsync(ct);

                Log.Information("ValidateConfiguration - Configuration validation result: {IsValid}", isValid);
                return Ok(ApiResponse<object>.Ok(
                    new { isValid, message = isValid ? "Configuration is valid and D365 is reachable" : "Configuration validation failed" },
                    isValid ? "Configuration validated successfully" : "Configuration validation failed"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "ValidateConfiguration - Error validating configuration");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while validating configuration: {ex.Message}"));
            }
        }
    }
}
