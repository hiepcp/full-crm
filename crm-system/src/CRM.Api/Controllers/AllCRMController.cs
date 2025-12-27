using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Shared.Dapper.Models;
using Shared.ExternalServices.Interfaces;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller quản lý AllCRM API.
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/all-crms")]
    public class AllCRMController : ControllerBase
    {
        private readonly IReferenceTypesService _referenceTypesService;
        private readonly IAllCRMService _allCRMService;
        private ISharepointService _sharePointService;
        private readonly IMemoryCache _memoryCache;
        private readonly IServiceProvider _serviceProvider;

        /// <summary>
        /// AllCRMController
        /// </summary>
        /// <param name="referenceTypesService"></param>
        /// <param name="allCRMService"></param>
        /// <param name="sharepointService"></param>
        /// <param name="memoryCache"></param>
        /// <param name="serviceProvider"></param>
        public AllCRMController(IReferenceTypesService referenceTypesService, IAllCRMService allCRMService,
            ISharepointService sharepointService,
            IMemoryCache memoryCache, IServiceProvider serviceProvider)
        {
            _referenceTypesService = referenceTypesService;
            _allCRMService = allCRMService;
            _sharePointService = sharepointService;
            _memoryCache = memoryCache;
            _serviceProvider = serviceProvider;
        }

        /// <summary>
        /// Get365
        /// </summary>
        /// <param name="refType"></param>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <param name="sortColumn"></param>
        /// <param name="sortOrder"></param>
        /// <param name="filters"></param>
        /// <returns></returns>
        [HttpPost("get-dynamics")]
        public async Task<IActionResult> Get365([FromQuery] int refType,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] List<FilterRequest>? filters = null)
        {
            try
            {
                // Validate filters
                if (!await _allCRMService.ValidateFilterRequest(refType, filters))
                {
                    return BadRequest(new { error = "Invalid filter fields" });
                }

                var request = new PagedRequest
                {
                    Page = page,
                    PageSize = pageSize,
                    SortColumn = sortColumn,
                    SortOrder = sortOrder,
                    Filters = filters ?? new List<FilterRequest>()
                };

                var result = await _allCRMService.GetDataAsync(refType, request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

        /// <summary>
        /// GetByModalName
        /// </summary>
        /// <param name="modalName"></param>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <param name="sortColumn"></param>
        /// <param name="sortOrder"></param>
        /// <param name="filters"></param>
        /// <returns></returns>
        [HttpPost("get-by-modal")]
        public async Task<IActionResult> GetByModalName([FromQuery] string modalName,
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] List<FilterRequest>? filters = null)
        {
            try
            {
                var request = new PagedRequest
                {
                    Page = page,
                    PageSize = pageSize,
                    SortColumn = sortColumn,
                    SortOrder = sortOrder,
                    Filters = filters ?? new List<FilterRequest>()
                };

                var result = await _allCRMService.GetDataByModalAsync(modalName, request);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { error = ex.Message });
            }
        }

    }
}
