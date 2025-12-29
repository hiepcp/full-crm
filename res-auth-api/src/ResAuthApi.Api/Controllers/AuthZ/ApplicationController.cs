using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResAuthApi.Api.Common;
using ResAuthZApi.Application.Interfaces.Services;
using Shared.Dapper.Models;

namespace ResAuthZApi.Api.Controllers
{
    [Authorize]
    [Route("api/application")]
    [ApiController]
    public class ApplicationController : ControllerBase
    {
        private readonly IApplicationService _applicationService;

        public ApplicationController(IApplicationService applicationService)
        {
            _applicationService = applicationService;
        }
        
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Domain.Entities.Application application)
        {
            if (application == null)
                return BadRequest(ApiResponse<string>.Fail("Invalid application data"));

            await _applicationService.AddAsync(application);

            return Ok(ApiResponse<Domain.Entities.Application>.Ok(application, "application created successfully"));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Domain.Entities.Application application)
        {
            if (application == null || application.AppId != id)
                return BadRequest(ApiResponse<string>.Fail("Invalid application data"));

            var existing = await _applicationService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<string>.Fail("application not found"));

            await _applicationService.UpdateAsync(application);

            return Ok(ApiResponse<Domain.Entities.Application>.Ok(application, "application updated successfully"));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _applicationService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<string>.Fail("application not found"));

            await _applicationService.DeleteAsync(id);

            return Ok(ApiResponse<string>.Ok("application deleted successfully"));
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

            var result = await _applicationService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<PagedResult<Domain.Entities.Application>>.Ok(result, "Get paged successfully"));
        }

    }
}
