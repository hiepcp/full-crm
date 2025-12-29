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
    [Route("api/role")]
    [ApiController]
    public class RolesController : ControllerBase
    {
        private readonly IRoleService _roleService;

        public RolesController(IRoleService roleService)
        {
            _roleService = roleService;
        }

        // DTO cho request body
        public class UpdatePermissionsRequest
        {
            public List<int> PermissionIds { get; set; } = new();
        }

        [HttpPost("{roleId}/permissions")]
        public async Task<IActionResult> UpdatePermissions(int roleId, [FromBody] UpdatePermissionsRequest request)
        {
            if (request.PermissionIds == null || request.PermissionIds.Count == 0)
                return BadRequest("PermissionIds is required");

            await _roleService.UpdateRolePermissionsAsync(roleId, request.PermissionIds);

            return Ok(ApiResponse<Role>.Ok(new Role(), "Permissions updated successfully"));
        }

        [HttpGet("{appCode}/{roleId}/permissions")]
        public async Task<IActionResult> GetPermissionsFlatByRole(int roleId, string appCode = "ComplApi")
        {
            var permissions = await _roleService.GetRolePermissionsFlatAsync(roleId, appCode);
            return Ok(ApiResponse<IEnumerable<RolePermissionFlatDto>>.Ok(permissions, "Get permissions flat successfully"));
        }

        [HttpGet("{appCode}/{roleId}/permissions-tree")]
        public async Task<IActionResult> GetPermissionsTreeByRole(int roleId = 4, string appCode = "ComplApi")
        {
            var permissions = await _roleService.GetRolePermissionsTreeAsync(roleId, appCode);
            return Ok(ApiResponse<IEnumerable<ResourcePermissionTreeDto>>.Ok(permissions, "Get permissions tree successfully"));
        }

        //[HttpPost]
        //public async Task<IActionResult> Create([FromBody] Role role)
        //{
        //    if (role == null)
        //        return BadRequest(ApiResponse<string>.Fail("Invalid role data"));

        //    await _roleService.AddAsync(role);

        //    return Ok(ApiResponse<Role>.Ok(role, "role created successfully"));
        //}

        //[HttpPut("{id:int}")]
        //public async Task<IActionResult> Update(int id, [FromBody] Role role)
        //{
        //    if (role == null || role.RoleId != id)
        //        return BadRequest(ApiResponse<string>.Fail("Invalid role data"));

        //    var existing = await _roleService.GetByIdAsync(id);
        //    if (existing == null)
        //        return NotFound(ApiResponse<string>.Fail("role not found"));

        //    await _roleService.UpdateAsync(role);

        //    return Ok(ApiResponse<Role>.Ok(role, "role updated successfully"));
        //}

        //[HttpDelete("{id:int}")]
        //public async Task<IActionResult> Delete(int id)
        //{
        //    var existing = await _roleService.GetByIdAsync(id);
        //    if (existing == null)
        //        return NotFound(ApiResponse<string>.Fail("role not found"));

        //    await _roleService.DeleteAsync(id);

        //    return Ok(ApiResponse<string>.Ok("role deleted successfully"));
        //}

        //[HttpGet]
        //public async Task<IActionResult> GetAll()
        //{
        //    Log.Information("Hello endpoint was called at {Path}", HttpContext.Request.Path);
        //    var userEmail = HttpContext.Items["UserEmail"]?.ToString();
        //    Log.Information("User email from middleware: {UserEmail}", userEmail);

        //    var result = await _roleService.GetAllAsync();
        //    return Ok(ApiResponse<IEnumerable<Role>>.Ok(result, "Get all successfully"));
        //}

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

            var result = await _roleService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<PagedResult<Role>>.Ok(result, "Get paged successfully"));
        }

    }
}
