using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResAuthApi.Api.Common;
using ResAuthZApi.Application.Interfaces.Services;
using Shared.Dapper.Models;

namespace ResAuthZApi.Api.Controllers
{
    [Authorize]
    [Route("api/action")]
    [ApiController]
    public class ActionController : ControllerBase
    {
        private readonly IActionService _actionService;

        public ActionController(IActionService actionService)
        {
            _actionService = actionService;
        }
        
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Domain.Entities.Action action)
        {
            if (action == null)
                return BadRequest(ApiResponse<string>.Fail("Invalid action data"));

            await _actionService.AddAsync(action);

            return Ok(ApiResponse<Domain.Entities.Action>.Ok(action, "action created successfully"));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Domain.Entities.Action action)
        {
            if (action == null || action.ActionId != id)
                return BadRequest(ApiResponse<string>.Fail("Invalid action data"));

            var existing = await _actionService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<string>.Fail("action not found"));

            await _actionService.UpdateAsync(action);

            return Ok(ApiResponse<Domain.Entities.Action>.Ok(action, "action updated successfully"));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _actionService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<string>.Fail("action not found"));

            await _actionService.DeleteAsync(id);

            return Ok(ApiResponse<string>.Ok("action deleted successfully"));
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

            var result = await _actionService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<PagedResult<Domain.Entities.Action>>.Ok(result, "Get paged successfully"));
        }

    }
}
