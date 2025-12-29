using CRMSys.Application.Constants;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Shared.AuthN.Common;
using Shared.Dapper.Models;

namespace CRMSysApi.Api.Controllers
{
    /// <summary>
    /// Controller quản lý CRMCommon API.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/common")]
    public class CommonController : ControllerBase
    {
        private readonly IReferenceTypesService _referenceTypesService;

        /// <summary>
        /// Init CommonController
        /// </summary>
        /// <param name="referenceTypesService"></param>
        public CommonController(IReferenceTypesService referenceTypesService)
        {
            _referenceTypesService = referenceTypesService;
        }


        /// <summary>
        /// complType = "1", hiện tại đang có Predefined = 1, Additional = 2
        /// </summary>        
        [HttpGet("reference-types-by-compliance-types")]
        public async Task<IActionResult> GetReferenceByComplType(string complType = "", CancellationToken ct = default)
        {
            var filters = new List<FilterRequest>();
            if (!string.IsNullOrWhiteSpace(complType))
            {
                filters.Add(new FilterRequest
                {
                    Column = "ComplType",
                    Operator = "in",
                    Value = complType
                });
            }

            var request = new PagedRequest
            {
                Page = 1,
                PageSize = 500,
                SortColumn = "SortOrder",
                SortOrder = "asc",
                Filters = filters
            };

            var result = await _referenceTypesService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<IEnumerable<EnumDto>>.Ok(result, "Retrieved reference types successfully"));
        }

        /// <summary>
        /// kind = 0 lấy hết
        /// </summary>        
        [HttpGet("reference-types/{kind:int}")]
        public async Task<IActionResult> GetPagedComplGroups(int kind = 0, CancellationToken ct = default)
        {
            var filters = new List<FilterRequest>();
            if (kind > 0)
            {
                filters.Add(new FilterRequest
                {
                    Column = "Kind",
                    Operator = "in",
                    Value = kind
                });
            }

            var request = new PagedRequest
            {
                Page = 1,
                PageSize = 500,
                SortColumn = "SortOrder",
                SortOrder = "asc",
                Filters = filters
            };

            var result = await _referenceTypesService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<IEnumerable<EnumDto>>.Ok(result, "Retrieved reference types successfully"));
        }

        /// <summary>
        /// truyền kind = '1,2' ko truyền lấy hết
        /// </summary>   
        [HttpGet("reference-types")]
        public async Task<IActionResult> GetPagedComplGroups(string kind = "", CancellationToken ct = default)
        {
            var filters = new List<FilterRequest>();
            if (!string.IsNullOrWhiteSpace(kind))
            {
                filters.Add(new FilterRequest
                {
                    Column = "Kind",
                    Operator = "in",
                    Value = kind
                });
            }

            var request = new PagedRequest
            {
                Page = 1,
                PageSize = 500,
                SortColumn = "SortOrder",
                SortOrder = "asc",
                Filters = filters
            };

            var result = await _referenceTypesService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<IEnumerable<EnumDto>>.Ok(result, "Retrieved reference types successfully"));
        }

        /// <summary>
        /// GetFRTreatmentTypes
        /// </summary>
        /// <returns></returns>
        [HttpGet("fr-treatment-types")]
        public async Task<IActionResult> GetFRTreatmentTypes()
        {
            var list = EnumHelper.ToList<FRTreatmentType>();
            return Ok(ApiResponse<IEnumerable<EnumDto>>.Ok(list, $"Retrieved FR treatment types successfully"));
        }
    }
}
