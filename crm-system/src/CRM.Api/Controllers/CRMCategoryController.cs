using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSysApi.Api.Controllers
{
    /// <summary>
    /// CRMCategoryController 
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/categories")]
    public class CRMCategoryController : ControllerBase
    {
        private readonly ICRMCategoryService _CRMCategoryService;
        private readonly ICategorySharePointSyncService _syncService;

        /// <summary>
        /// Init CRMCategoryController
        /// </summary>
        /// <param name="CRMCategoryService"></param>
        /// <param name="syncService"></param>
        public CRMCategoryController(ICRMCategoryService CRMCategoryService, ICategorySharePointSyncService syncService)
        {
            _CRMCategoryService = CRMCategoryService;
            _syncService = syncService;
        }

        /// <summary>
        /// Get category by ID
        /// </summary>
        /// <param name="id">Category ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>category</returns>
        /// <response code="200">Successfully returned category details</response>
        /// <response code="404">category</response>
        /// <response code="500">Server error while processing request</response>
        [Authorize(Policy = "Category.ReadOne")]
        [HttpGet("get-by-id/{id:long}")]
        [ProducesResponseType(typeof(ApiResponse<CRMCategory>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 404)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetById(long id, CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetById - Starting request for id: {Id}", id);
                
                var CRMCategory = await _CRMCategoryService.GetByIdAsync(id, ct);
                if (CRMCategory == null)
                {
                    Log.Warning("GetById - Category not found for id: {Id}", id);
                    return NotFound(ApiResponse<string>.Fail($"Category with ID {id} was not found"));
                }
                
                Log.Information("GetById - Successfully retrieved category with id: {Id}", id);
                return Ok(ApiResponse<CRMCategory>.Ok(CRMCategory, "Get Category successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetById - Error retrieving category with id: {Id}", id);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving the category: {ex.Message}"));
            }
        }

        /// <summary>
        /// categories
        /// </summary>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of tất cả categories</returns>
        /// <response code="200">Successfully returned List of categories</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<CRMCategory>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetAll(CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetAll - Starting request");
                
                var CRMCategories = await _CRMCategoryService.GetAllAsync(ct);
                
                if (CRMCategories == null)
                {
                    Log.Information($"GetAll - null");
                }

                Log.Information("GetAll - Retrieved {Count} categories", CRMCategories?.Count() ?? 0);
                return Ok(ApiResponse<IEnumerable<CRMCategory>>.Ok(
                    CRMCategories!, 
                    $"Retrieved {(CRMCategories?.Count() ?? 0)} categories successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetAll - Error retrieving categories");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving categories: {ex.Message}"));
            }
        }

        /// <summary>
        /// Query categories with pagination and filtering
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Số records mỗi trang (mặc định: 10)</param>
        /// <param name="sortColumn">Column name to sort by</param>
        /// <param name="sortOrder">Sort order: asc or desc (default: asc)</param>
        /// <param name="filters">List of filters</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of categories</returns>
        /// <response code="200">Successfully returned List of categories</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [AllowAnonymous] // T?m th?i b? authorize d? test
        [HttpPost("get-all")]
        [ProducesResponseType(typeof(ApiResponse<PagedResult<CRMCategoryResponseDto>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] List<FilterRequest>? filters = null,
            CancellationToken ct = default)
        {
            try
            {
                Log.Information("GetPaged - Starting request. Page: {Page}, PageSize: {PageSize}", page, pageSize);

                // Validate input parameters
                if (page < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page number must be greater than 0"));

                if (pageSize < 1)
                    return BadRequest(ApiResponse<string>.Fail("Page size must be greater than 0"));

                if (!string.IsNullOrEmpty(sortOrder) && !sortOrder.Equals("asc", StringComparison.OrdinalIgnoreCase) 
                    && !sortOrder.Equals("desc", StringComparison.OrdinalIgnoreCase))
                    return BadRequest(ApiResponse<string>.Fail("Sort order must be either 'asc' or 'desc'"));

                var request = new PagedRequest
                {
                    Page = page,
                    PageSize = pageSize,
                    SortColumn = sortColumn,
                    SortOrder = sortOrder,
                    Filters = filters ?? new List<FilterRequest>()
                };

                // Normalize filter values
                if (filters?.Any() == true)
                {
                    foreach (var filter in filters)
                    {
                        filter.Normalize();
                    }
                }

                Log.Information("GetPaged - Executing query with request: {@Request}", request);
                var result = await _CRMCategoryService.GetPagedAsync(request, ct);
                
                Log.Information("GetPaged - Retrieved page {Page}. Total records: {TotalCount}", page, result.TotalCount);
                return Ok(ApiResponse<PagedResult<CRMCategoryResponseDto>>.Ok(
                    result,
                    $"Retrieved page {page} of categories successfully. Total records: {result.TotalCount}"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetPaged - Error retrieving paged categories");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving paged categories: {ex.Message}"));
            }
        }

        /// <summary>
        /// Create new category
        /// </summary>
        /// <param name="dto">category information to create</param>
        /// <returns>ID of the created category</returns>
        /// <response code="201">Successfully created category, returns ID</response>
        /// <response code="400">Invalid request</response>
        [Authorize(Policy = "Category.Create")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] CRMCategoryRequestDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
                var id = await _CRMCategoryService.AddAsync(dto, userEmail);

                return Ok(ApiResponse<long>.Ok(id, 
                    "Category created successfully with SharePoint folder synchronization"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to create category and SharePoint folder: {ex.Message}"));
            }
        }

        /// <summary>
        /// Update
        /// </summary>
        /// <param name="id"></param>
        /// <param name="dto"></param>
        /// <returns></returns>
        [Authorize(Policy = "Category.Update")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] CRMCategoryRequestDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "";
                await _CRMCategoryService.UpdateAsync(id, dto, userEmail);

                return Ok(ApiResponse<string>.Ok("", 
                    "Category updated successfully with SharePoint folder synchronization"));
            }
            catch (FluentValidation.ValidationException vex)
            {
                return BadRequest(ApiResponse<string>.Fail(vex.Message));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to update category and SharePoint folder: {ex.Message}"));
            }
        }

        /// <summary>
        /// Delete
        /// </summary>
        /// <param name="id"></param>
        /// <returns></returns>
        [Authorize(Policy = "Category.Delete")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "";
                await _CRMCategoryService.DeleteAsync(id, userEmail);

                return Ok(ApiResponse<string>.Ok("", 
                    "Category deleted successfully. Note: Associated SharePoint folder was preserved."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete category: {ex.Message}"));
            }
        }

        /// <summary>
        /// DeleteMulti
        /// </summary>
        /// <param name="ids"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [Authorize(Policy = "Category.Delete")]
        [HttpPost("delete-multi")]
        public async Task<IActionResult> DeleteMulti([FromBody] IEnumerable<long> ids, CancellationToken ct = default)
        {
            if (ids == null || !ids.Any())
                return BadRequest(ApiResponse<string>.Fail("No IDs provided for deletion"));

            try
            {
                await _CRMCategoryService.DeleteMultiAsync(ids, ct);
                return Ok(ApiResponse<string>.Ok("", 
                    "Categories deleted successfully. Note: Associated SharePoint folders were preserved."));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to delete categories: {ex.Message}"));
            }
        }

        /// <summary>
        /// GetOrphanedFolders
        /// </summary>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("orphaned-folders")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<string>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetOrphanedFolders(CancellationToken ct)
        {
            try
            {
                Log.Information("GetOrphanedFolders - Starting request");
                var orphanedFolders = await _syncService.GetOrphanedFoldersAsync(ct);
                Log.Information("GetOrphanedFolders - Found {Count} orphaned folders", orphanedFolders?.Count() ?? 0);
                
                return Ok(ApiResponse<IEnumerable<string>>.Ok(
                    orphanedFolders,
                    $"Found {orphanedFolders?.Count() ?? 0} orphaned SharePoint folders"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetOrphanedFolders - Error getting orphaned folders");
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to get orphaned SharePoint folders: {ex.Message}"));
            }
        }

        /// <summary>
        /// CheckFolder
        /// </summary>
        /// <param name="path"></param>
        /// <param name="ct"></param>
        /// <returns></returns>
        [HttpGet("check-folder")]
        [ProducesResponseType(typeof(ApiResponse<bool>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> CheckFolder(string path, CancellationToken ct)
        {
            try
            {
                if (string.IsNullOrEmpty(path))
                {
                    return BadRequest(ApiResponse<string>.Fail("Folder path cannot be empty"));
                }

                Log.Information("CheckFolder - Checking path: {Path}", path);
                var hasMatching = await _syncService.HasMatchingCategoryAsync(path, ct);
                Log.Information("CheckFolder - Path {Path} has matching category: {HasMatching}", path, hasMatching);

                return Ok(ApiResponse<bool>.Ok(
                    hasMatching,
                    hasMatching 
                        ? "Found matching Category for the SharePoint folder"
                        : "No matching Category found for the SharePoint folder"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "CheckFolder - Error checking folder path: {Path}", path);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"Failed to check SharePoint folder: {ex.Message}"));
            }
        }
    }
}
