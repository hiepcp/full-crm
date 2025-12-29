using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ResAuthApi.Api.Common;
using ResAuthZApi.Application.Dtos;
using ResAuthZApi.Application.Interfaces.Services;
using ResAuthZApi.Domain.Entities;
using Shared.Dapper.Models;

namespace ResAuthZApi.Api.Controllers
{
    [Authorize]
    [Route("api/menu")]
    [ApiController]
    public class MenuController : ControllerBase
    {
        private readonly IMenuService _menuService;

        public MenuController(IMenuService menuService)
        {
            _menuService = menuService;
        }

        [HttpGet("permissions")]
        public async Task<IActionResult> GetMenuOfUserAsync([FromQuery] string appCode = "CRMApi", string email = "thiennh@response.com.vn")
        {
            try
            {
                var menus = await _menuService.GetMenuWithPermissionsOfUserAsync(appCode, email);
                return Ok(ApiResponse<IEnumerable<MenuDto>>.Ok(menus, $"Get menus of user {email} successfully"));
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ApiResponse<IEnumerable<string>>.Fail(ex.Message));
            }
            catch (Exception ex)
            {
                // Log the exception
                return StatusCode(500, ApiResponse<IEnumerable<string>>.Fail("Internal server error"));
            }
        }

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] Menu menu)
        {
            if (menu == null)
                return BadRequest(ApiResponse<string>.Fail("Invalid menu data"));

            await _menuService.AddAsync(menu);

            return Ok(ApiResponse<Menu>.Ok(menu, "menu created successfully"));
        }

        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] Menu menu)
        {
            if (menu == null || menu.Id != id)
                return BadRequest(ApiResponse<string>.Fail("Invalid menu data"));

            var existing = await _menuService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<string>.Fail("menu not found"));

            await _menuService.UpdateAsync(menu);

            return Ok(ApiResponse<Menu>.Ok(menu, "menu updated successfully"));
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var existing = await _menuService.GetByIdAsync(id);
            if (existing == null)
                return NotFound(ApiResponse<string>.Fail("menu not found"));

            await _menuService.DeleteAsync(id);

            return Ok(ApiResponse<string>.Ok("menu deleted successfully"));
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

            var result = await _menuService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<PagedResult<Menu>>.Ok(result, "Get paged successfully"));
        }

    }
}
