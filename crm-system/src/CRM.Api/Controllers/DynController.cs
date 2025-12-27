using CRMSys.Api.Utils;
using CRMSys.Application.Dtos;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Services;
using CRMSys.Application.Utils;
using CRMSys.Domain.Dynamics;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;
using Shared.ExternalServices.Interfaces;
using Shared.ExternalServices.Models;
using Shared.ExternalServices.Models.Dynamics;
using Shared.ExternalServices.Utilities;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for Dynamics 365 integration
    /// </summary>
    [Route("api/dynamics")]
    [ApiController]
    public class DynController : ControllerBase
    {
        private IDynamicService _dynamicService;
        private readonly DynamicsParameterManager _paramManager;
        private readonly ODataFilterParser<RSVNEcoResCategories> _parser;
        private ICRMDynamicsService _CRMDynamicsService;

        /// <summary>
        /// Init
        /// </summary>
        /// <param name="paramManager"></param>
        /// <param name="parser"></param>
        /// <param name="dynamicService"></param>
        /// <param name="CRMDynamicsService"></param>
        public DynController(DynamicsParameterManager paramManager, ODataFilterParser<RSVNEcoResCategories> parser, IDynamicService dynamicService, ICRMDynamicsService CRMDynamicsService)
        {
            _dynamicService = dynamicService;
            _paramManager = paramManager;
            _parser = parser;
            _CRMDynamicsService = CRMDynamicsService;
        }

        /// <summary>
        /// Query Dynamics reference data with pagination and filtering
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Số records mỗi trang (mặc định: 10)</param>
        /// <param name="sortColumn">Column name to sort by</param>
        /// <param name="sortOrder">Sort order: asc or desc (default: asc)</param>
        /// <param name="refType">Loại reference data (mặc định: 1)</param>
        /// <param name="filters">List of filters</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Paginated list of reference data</returns>
        [HttpPost("reference")]
        public async Task<IActionResult> ReferenceData([FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromQuery] int refType = 1,
            [FromBody] List<FilterRequest>? filters = null, CancellationToken ct = default)
        {
            try
            {
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
                 
                var result = await _CRMDynamicsService.GetDynRefePagedAsync(refType, request, ct);
                 
                return Ok(ApiResponse<PagedResult<CRMDynReferenceResponseDto>>.Ok(
                    result,
                    $"Retrieved page {page} of categories successfully. Total records: {result.TotalCount}"));                
            }
            catch (Exception)
            {
                throw;
            }
        }

        //[HttpPost("customers")]
        //[ProducesResponseType(typeof(ApiResponse<OdataMapper<RSVNCustTableEntities>>), 200)]
        //[ProducesResponseType(typeof(ApiResponse<string>), 400)]
        //[ProducesResponseType(typeof(ApiResponse<string>), 500)]
        //public async Task<IActionResult> GetAllCustomers([FromQuery] int page = 1,
        //    [FromQuery] int pageSize = 10,
        //    [FromQuery] string? sortColumn = null,
        //    [FromQuery] string sortOrder = "asc",
        //    [FromBody] List<FilterRequest>? filters = null)
        //{
        //    try
        //    {
        //        // Initialize list to store OData filter strings
        //        List<string> filterStrings = new List<string>();

        //        // Process filters if any exist
        //        if (filters != null && filters.Any())
        //        {
        //            foreach (var filter in filters)
        //            {
        //                // Normalize the filter to handle JSON conversion
        //                filter.Normalize();
        //                try
        //                {
        //                    // Convert the operator to OData format and validate
        //                    string odataOperator = ODataOperatorConverter.ToODataOperator(filter.Operator);
        //                    string formattedValue = ODataOperatorConverter.FormatValue(filter.Value!, odataOperator);

        //                    // Build the basic comparison filter
        //                    string filterStr = $"{filter.Column} {odataOperator} {formattedValue}";

        //                    // Validate the filter
        //                    string safeFilter = _parser.ParseAndValidate(filterStr);
        //                    if (!string.IsNullOrEmpty(safeFilter))
        //                    {
        //                        filterStrings.Add(safeFilter);
        //                    }
        //                }
        //                catch (ArgumentException ex)
        //                {
        //                    return BadRequest(ApiResponse<string>.Fail($"Invalid filter operator: {ex.Message}"));
        //                }
        //            }
        //        }

        //        // Set up the query parameters
        //        _paramManager.SetEntity("RSVNCustTableEntities");

        //        // Add all validated filters
        //        foreach (var filter in filterStrings)
        //        {
        //            _paramManager.AddFilter(filter);
        //        }

        //        // Add sorting if specified
        //        if (!string.IsNullOrEmpty(sortColumn))
        //        {
        //            string orderBy = $"{sortColumn} {sortOrder}";
        //            _paramManager.SetOrderBy(orderBy);
        //        }

        //        // Set up pagination (convert to skip/take for OData)
        //        _paramManager.SetPaging(pageSize, (page - 1) * pageSize);

        //        // Enable count for pagination metadata
        //        string url = _paramManager.EnableCount().BuildUrl();

        //        // Execute the query
        //        var data = await _dynamicService.QueryAsync(url);
        //        if (string.IsNullOrEmpty(data))
        //        {
        //            return BadRequest(ApiResponse<string>.Fail("Failed to retrieve data from dynamics"));
        //        }

        //        // Parse and return the response
        //        var response = JsonConvert.DeserializeObject<OdataMapper<RSVNCustTableEntities>>(data);
        //        return Ok(ApiResponse<OdataMapper<RSVNCustTableEntities>>.Ok(response!, "Retrieved customers successfully"));
        //    }
        //    catch (Exception ex)
        //    {
        //        return StatusCode(500, ApiResponse<string>.Fail($"An error occurred: {ex.Message}"));
        //    }
        //}

        /// <summary>
        /// FactoryDataArea
        /// </summary>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <param name="sortColumn"></param>
        /// <param name="sortOrder"></param>
        /// <param name="filters"></param>
        /// <returns></returns>
        [HttpPost("factories")]
        public async Task<IActionResult> FactoryDataArea([FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] List<FilterRequest>? filters = null)
        {
            try
            {
                _paramManager.SetEntity("RSVNDataAreas");
                // Add sorting if specified
                if (!string.IsNullOrEmpty(sortColumn))
                {
                    string orderBy = $"{sortColumn} {sortOrder}";
                    _paramManager.SetOrderBy(orderBy);
                }

                // Set up pagination (convert to skip/take for OData)
                _paramManager.SetPaging(pageSize, (page - 1) * pageSize);

                string url = _paramManager.EnableCount().BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    // Parse and return the response
                    var response = JsonConvert.DeserializeObject<OdataMapper<RSVNDataAreas>>(data);
                    return Ok(ApiResponse<OdataMapper<RSVNDataAreas>>.Ok(response!, "Retrieved factories successfully"));
                }

                return BadRequest("Failed to retrive data from dynamics!");
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// RSVNInventTables
        /// </summary>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <param name="sortColumn"></param>
        /// <param name="sortOrder"></param>
        /// <param name="filters"></param>
        /// <returns></returns>
        [HttpPost("products")]
        public async Task<IActionResult> RSVNInventTables([FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] List<FilterRequest>? filters = null)
        {
            try
            {
                _paramManager.SetEntity("RSVNInventTables");
                // Add sorting if specified
                if (!string.IsNullOrEmpty(sortColumn))
                {
                    string orderBy = $"{sortColumn} {sortOrder}";
                    _paramManager.SetOrderBy(orderBy);
                }

                // Set up pagination (convert to skip/take for OData)
                _paramManager.SetPaging(pageSize, (page - 1) * pageSize);

                string url = _paramManager.EnableCount().BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    // Parse and return the response
                    var response = JsonConvert.DeserializeObject<OdataMapper<RSVNInventTables>>(data);
                    return Ok(ApiResponse<OdataMapper<RSVNInventTables>>.Ok(response!, "Retrieved products successfully"));
                }

                return BadRequest("Failed to retrive data from dynamics!");
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// SalesQuotationHeadersV2
        /// </summary>
        /// <param name="page"></param>
        /// <param name="pageSize"></param>
        /// <param name="sortColumn"></param>
        /// <param name="sortOrder"></param>
        /// <param name="filters"></param>
        /// <returns></returns>
        [HttpPost("sales-quotation-headers")]
        public async Task<IActionResult> SalesQuotationHeadersV2([FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = null,
            [FromQuery] string sortOrder = "asc",
            [FromBody] List<FilterRequest>? filters = null)
        {
            try
            {
                var filterStrings = new List<string>();

                if (filters != null && filters.Any())
                {
                    foreach (var filter in filters)
                    {
                        filter.Normalize();
                        try
                        {
                            var odataOperator = ODataOperatorConverter.ToODataOperator(filter.Operator);
                            var dataType = filter.Column == "RSVNQuotationType" ? "Edm.Int32" : "Edm.String";
                            var formattedValue = ODataOperatorConverter.FormatValue(filter.Value!, dataType, odataOperator);
                            var filterStr = $"{filter.Column} {odataOperator} {formattedValue}";
                            ODataFilterParser<Domain.Dynamics.SalesQuotationHeadersV2> parserQuotation = new ODataFilterParser<Domain.Dynamics.SalesQuotationHeadersV2>();
                            var safeFilter = parserQuotation.ParseAndValidate(filterStr);
                            if (!string.IsNullOrEmpty(safeFilter))
                            {
                                filterStrings.Add(safeFilter);
                            }
                        }
                        catch (ArgumentException ex)
                        {
                            return BadRequest(ApiResponse<string>.Fail($"Invalid filter operator: {ex.Message}"));
                        }
                    }
                }

                _paramManager.SetEntity("SalesQuotationHeadersV2");

                foreach (var filter in filterStrings)
                {
                    _paramManager.AddFilter(filter);
                }

                _paramManager.AddFilter("RSVNQuotationType eq Microsoft.Dynamics.DataEntities.RSVNQuotationTypeEnum'None'");

                if (!string.IsNullOrEmpty(sortColumn))
                {
                    var orderBy = $"{sortColumn} {sortOrder}";
                    _paramManager.SetOrderBy(orderBy);
                }

                _paramManager.SetPaging(pageSize, (page - 1) * pageSize);
                var url = _paramManager.EnableCount().BuildUrl();

                var data = await _dynamicService.QueryAsync(url);
                if (string.IsNullOrEmpty(data))
                {
                    return BadRequest(ApiResponse<string>.Fail("Failed to retrieve data from dynamics"));
                }

                var response = JsonConvert.DeserializeObject<OdataMapper<Domain.Dynamics.SalesQuotationHeadersV2>>(data);
                return Ok(ApiResponse<OdataMapper<Domain.Dynamics.SalesQuotationHeadersV2>>.Ok(response!, "Retrieved sales quotations successfully"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// Range
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("range")]
        public async Task<IActionResult> Range(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            try
            {
                string safeFilter = _parser.ParseAndValidate(filter);

                string url = _paramManager
                .SetEntity("RSVNEcoResCategories")
                .AddFilter("Level eq 2")
                .AddFilter("CategoryHierarchy eq 5637147577")
                .AddFilter(safeFilter)
                .SetOrderBy(orderBy)
                .SetPaging(top, skip)
                .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);
                if (string.IsNullOrEmpty(data))
                {
                    return BadRequest(ApiResponse<string>.Fail("Failed to retrieve data from dynamics"));
                }

                var response = JsonConvert.DeserializeObject<OdataMapper<RSVNEcoResCategories>>(data);
                return Ok(ApiResponse<OdataMapper<RSVNEcoResCategories>>.Ok(response!, "Retrieved range data successfully"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// ProductType
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("product-type")]
        public async Task<IActionResult> ProductType(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            try
            {
                string safeFilter = _parser.ParseAndValidate(filter);

                string url = _paramManager
                .SetEntity("RSVNEcoResCategories")
                .AddFilter("Level eq 2")
                .AddFilter("CategoryHierarchy eq 5637146826")
                .AddFilter(safeFilter)
                .SetOrderBy(orderBy)
                .SetPaging(top, skip)
                .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);
                if (string.IsNullOrEmpty(data))
                {
                    return BadRequest(ApiResponse<string>.Fail("Failed to retrieve data from dynamics"));
                }

                var response = JsonConvert.DeserializeObject<OdataMapper<RSVNEcoResCategories>>(data);
                return Ok(ApiResponse<OdataMapper<RSVNEcoResCategories>>.Ok(response!, "Retrieved product type data successfully"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// RSVNProductMasters
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("RSVNProductMasters")]
        public async Task<IActionResult> RSVNProductMasters(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            string safeFilter = _parser.ParseAndValidate(filter);

            string url = _paramManager
            .SetEntity("RSVNProductMasters")
            .AddFilter(safeFilter)
            .SetOrderBy(orderBy)
            .SetPaging(top, skip)
            .BuildUrl();

            var data = await _dynamicService.QueryAsync(url);

            if (data != "")
            {
                OdataMapper<RSVNProductMasters> response = JsonConvert.DeserializeObject<OdataMapper<RSVNProductMasters>>(data)!;
                return Ok(response);
            }

            return BadRequest("Failed to retrive data from dynamics!");
        }

        /// <summary>
        /// RSVNProductVariants
        /// </summary>
        /// <param name="param"></param>
        /// <returns></returns>
        [HttpPost("RSVNProductVariants")]
        public async Task<IActionResult> RSVNProductVariants([FromBody] ODataQueryParameters param)
        {
            string safeFilter = _parser.ParseAndValidate(param.Filter);

            string url = _paramManager
            .SetEntity("RSVNProductVariants")
            .AddFilter("dataAreaId eq ''")
            .AddFilter(safeFilter)
            .SetOrderBy(param.OrderBy)
            .SetPaging(param.Top, param.Skip)
            .BuildUrl();

            try
            {
                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    OdataMapper<RSVNProductVariants> response = JsonConvert.DeserializeObject<OdataMapper<RSVNProductVariants>>(data)!;
                    return Ok(response);
                }
            }
            catch (Exception)
            {
                throw;
            }

            return BadRequest("Failed to retrive data from dynamics!");
        }

        ///// <summary>
        ///// GetAll
        ///// </summary>
        ///// <param name="skip"></param>
        ///// <param name="top"></param>
        ///// <param name="custClassificationId"></param>
        ///// <param name="accountNum"></param>
        ///// <returns></returns>
        ///// <exception cref="Exception"></exception>
        //[HttpGet("customer-get-all")]
        //public async Task<IActionResult> GetAll(int skip = 0, int top = 50, string custClassificationId = "", string accountNum = "")
        //{
        //    try
        //    {
        //        var filterAN = accountNum == "" ? "" : $"{nameof(RSVNCustTableEntities.AccountNum)} eq '{accountNum}'";
        //        var filterCCI = custClassificationId == "" ? "" : $"{nameof(RSVNCustTableEntities.CustClassificationId)} eq '{custClassificationId}'";

        //        string safeFilterAN = _parser.ParseAndValidate(filterAN);
        //        string safeFilterCCI = _parser.ParseAndValidate(filterCCI);

        //        string url = _paramManager
        //        .SetEntity("RSVNCustTableEntities")
        //        .AddFilter(safeFilterAN)
        //        .AddFilter(safeFilterCCI)
        //        .SetOrderBy("")
        //        .SetPaging(top, skip)
        //        .BuildUrl();

        //        var data = await _dynamicService.QueryAsync(url);
        //        OdataMapper<RSVNCustTableEntities> response = JsonConvert.DeserializeObject<OdataMapper<RSVNCustTableEntities>>(data)!;


        //        return Ok(response);
        //    }
        //    catch (Exception ex)
        //    {
        //        throw new Exception(ex.Message);
        //    }
        //}

        /// <summary>
        /// GetProspect
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("customer-prospect")]
        public async Task<IActionResult> GetProspect(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            string safeFilter = _parser.ParseAndValidate(filter);

            string url = _paramManager
            .SetEntity("RSVNProspectCustEntities")
            .AddFilter(safeFilter)
            .SetOrderBy(orderBy)
            .SetPaging(top, skip)
            .BuildUrl();

            var data = await _dynamicService.QueryAsync(url);

            if (data != "")
            {
                OdataMapper<RSVNProspectCustEntities> response = JsonConvert.DeserializeObject<OdataMapper<RSVNProspectCustEntities>>(data)!;
                return Ok(response);
            }

            return BadRequest("Failed to retrive data from dynamics!");
        }

        /// <summary>
        /// Groups
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("customer-groups")]
        public async Task<IActionResult> Groups(int skip = 0, int top = 100, string filter = "", string orderBy = "")
        {
            string safeFilter = _parser.ParseAndValidate(filter);

            string url = _paramManager
            .SetEntity("DimAttributeCustGroups")
            .AddFilter(safeFilter)
            .SetOrderBy(orderBy)
            .SetPaging(top, skip)
            .BuildUrl();

            var data = await _dynamicService.QueryAsync(url);

            if (data != "")
            {
                OdataMapper<DimAttributeCustGroups> response = JsonConvert.DeserializeObject<OdataMapper<DimAttributeCustGroups>>(data)!;
                return Ok(response);
            }

            return BadRequest("Failed to retrive data from dynamics!");
        }

        /// <summary>
        /// DataArea
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("data-area")]
        public async Task<IActionResult> DataArea(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            try
            {
                string safeFilter = _parser.ParseAndValidate(filter);

                string url = _paramManager
                .SetEntity("RSVNDataAreas")
                .AddFilter(safeFilter)
                .SetOrderBy(orderBy)
                .SetPaging(top, skip)
                .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    //var response = JsonConvert.DeserializeObject<OdataMapper<RSVNDataAreas>>(data);
                    return Ok(data);
                }

                return BadRequest("Failed to retrive data from dynamics!");
            }
            catch (Exception )
            {
                throw;
            }
        }

        /// <summary>
        /// RSVNHcmWorkers
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("hcm-workers")]
        public async Task<IActionResult> RSVNHcmWorkers(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            try
            {
                var parser = new ODataFilterParser<RSVNHcmWorkers>();
                string safeFilter = parser.ParseAndValidate(filter);

                var builder = _paramManager
                    .SetEntity("RSVNHcmWorkers")
                    .AddFilter("SysEmail ne ''");

                if (!string.IsNullOrWhiteSpace(safeFilter))
                {
                    builder.AddFilter(safeFilter);
                }

                string url = builder
                    //.SetOrderBy(orderBy)
                    .SetPaging(top, skip)
                    .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (string.IsNullOrEmpty(data))
                {
                    return BadRequest(ApiResponse<string>.Fail("Failed to retrieve data from dynamics"));
                }

                var response = JsonConvert.DeserializeObject<OdataMapper<RSVNHcmWorkers>>(data);
                return Ok(ApiResponse<OdataMapper<RSVNHcmWorkers>>.Ok(response!, "Retrieved hcm workers successfully"));
            }
            catch (Exception ex)
            {
                return StatusCode(500, ApiResponse<string>.Fail($"An error occurred: {ex.Message}"));
            }
        }

        /// <summary>
        /// InventTable
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("invent-table")]
        public async Task<IActionResult> InventTable(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            try
            {
                string safeFilter = _parser.ParseAndValidate(filter);

                string url = _paramManager
                .SetEntity("RSVNInventTables")
                .AddFilter(safeFilter)
                .SetOrderBy(orderBy)
                .SetPaging(top, skip)
                .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    //var response = JsonConvert.DeserializeObject<OdataMapper<RSVNInventTables>>(data);
                    return Ok(data);
                }

                return BadRequest("Failed to retrive data from dynamics!");
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// ProductVariantAttributes
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("product-variant-attributes")]
        public async Task<IActionResult> ProductVariantAttributes(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            try
            {
                //string safeFilter = _parser.ParseAndValidate(filter);

                string url = _paramManager
                .SetEntity("ProductVariantAttributes")
                .AddFilter(filter)
                .SetOrderBy(orderBy)
                .SetPaging(top, skip)
                .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    //var response = JsonConvert.DeserializeObject<OdataMapper<ProductVariantAttributes>>(data);
                    return Ok(data);
                }

                return BadRequest("Failed to retrive data from dynamics!");
            }
            catch (Exception)
            {

                throw;
            }
        }

        /// <summary>
        /// RSVNAttributeTypeValueAlls
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("attribute-type-value-alls")]
        public async Task<IActionResult> RSVNAttributeTypeValueAlls(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            try
            {
                //string safeFilter = _parser.ParseAndValidate(filter);

                string url = _paramManager
                .SetEntity("RSVNAttributeTypeValueAlls")
                .AddFilter(filter)
                .SetOrderBy(orderBy)
                .SetPaging(top, skip)
                .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    //var response = JsonConvert.DeserializeObject<OdataMapper<RSVNAttributeTypeValueAlls>>(data);
                    return Ok(data);
                }

                return BadRequest("Failed to retrive data from dynamics!");
            }
            catch (Exception)
            {

                throw;
            }
        }

        /// <summary>
        /// RSVNSalesOrderOpenInvoiceCogs
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("salesId")]
        public async Task<IActionResult> RSVNSalesOrderOpenInvoiceCogs(int skip = 0, int top = 50, string filter = "", string orderBy = "")
        {
            try
            {
                //string safeFilter = _parser.ParseAndValidate(filter);

                string url = _paramManager
                .SetEntity("RSVNSalesOrderOpenInvoiceCogs")
                .AddFilter(filter)
                .SetOrderBy(orderBy)
                .SetPaging(top, skip)
                .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    //var response = JsonConvert.DeserializeObject<OdataMapper<RSVNSalesOrderOpenInvoiceCogs>>(data);
                    return Ok(data);
                }

                return BadRequest("Failed to retrive data from dynamics!");
            }
            catch (Exception)
            {

                throw;
            }
        }

        /// <summary>
        /// RSVNSalesLineOpenInvoiceCogs
        /// </summary>
        /// <param name="skip"></param>
        /// <param name="top"></param>
        /// <param name="filter"></param>
        /// <param name="orderBy"></param>
        /// <returns></returns>
        [HttpGet("sales-line")]
        public async Task<IActionResult> RSVNSalesLineOpenInvoiceCogs(int skip = 0, int top = 50, string filter = "SalesId eq 'SO58611'", string orderBy = "")
        {
            try
            {
                //string safeFilter = _parser.ParseAndValidate(filter);

                string url = _paramManager
                .SetEntity("RSVNSalesLineOpenInvoiceCogs")
                .AddFilter(filter)
                .SetOrderBy(orderBy)
                .SetPaging(top, skip)
                .BuildUrl();

                var data = await _dynamicService.QueryAsync(url);

                if (data != "")
                {
                    //var response = JsonConvert.DeserializeObject<OdataMapper<RSVNSalesLineOpenInvoiceCogs>>(data);
                    return Ok(data);
                }

                return BadRequest("Failed to retrive data from dynamics!");
            }
            catch (Exception)
            {

                throw;
            }
        }

    }
}
