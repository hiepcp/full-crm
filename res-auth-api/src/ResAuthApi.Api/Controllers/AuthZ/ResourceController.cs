using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResAuthApi.Api.Common;
using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;
using Serilog;
using Shared.Dapper.Models;

namespace ResAuthZApi.Api.Controllers
{
    [Authorize]
    [Route("api/resource")]
    [ApiController]
    public class ResourceController : ControllerBase
    {
        private readonly IResourceService _resourceService;
        public ResourceController(IResourceService resourceService)
        {
            _resourceService = resourceService;
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ResourceRequest request)
        {
            var created = await _resourceService.CreateWithActionsAndPermissionsAsync(request);
            return Ok(created);
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ResourceRequest request)
        {
            var updated = await _resourceService.UpdateWithActionsAndPermissionsAsync(id, request);
            return Ok(updated);
        }

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            Log.Information("Hello endpoint was called at {Path}", HttpContext.Request.Path);
            var userEmail = HttpContext.Items["UserEmail"]?.ToString();
            Log.Information("User email from middleware: {UserEmail}", userEmail);

            var result = await _resourceService.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<Resource>>.Ok(result, "Get all resource successfully"));
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

            var result = await _resourceService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<PagedResult<Resource>>.Ok(result, "Get paged resource successfully"));
        }

    }
}
