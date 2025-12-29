using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResAuthApi.Api.Common;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;
using Serilog;
using Shared.Dapper.Models;

namespace ResAuthZApi.Api.Controllers
{
    [Authorize]
    [Route("api/permission")]
    [ApiController]
    public class PermissionController : ControllerBase
    {
        private readonly IPermissionService _permissionService;
        public PermissionController(IPermissionService permissionService)
        {
            _permissionService = permissionService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            Log.Information("Hello endpoint was called at {Path}", HttpContext.Request.Path);
            var userEmail = HttpContext.Items["UserEmail"]?.ToString();
            Log.Information("User email from middleware: {UserEmail}", userEmail);

            var permissions = await _permissionService.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<Permission>>.Ok(permissions, "Get all permission successfully"));
        }

        [HttpPost("get-all")]
        public async Task<IActionResult> GetPaged(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] List<FilterRequest>? filters = null,
            CancellationToken ct = default)
        {
            var request = new PagedRequest
            {
                Page = page,
                PageSize = pageSize,
                SortColumn = sortColumn,
                SortOrder = sortOrder,
                Filters = filters ?? new List<FilterRequest>()
            };

            var result = await _permissionService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<PagedResult<Permission>>.Ok(result, "Get paged permission successfully"));
        }


    }
}
