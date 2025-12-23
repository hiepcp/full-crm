using ComplianceSys.Application.Dtos.Request;
using ComplianceSys.Application.Dtos.Response;
using ComplianceSys.Application.Interfaces.Services;
using ComplianceSys.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;
using Shared.Dapper.Models;
using Shared.ExternalServices.Interfaces;
using Shared.ExternalServices.Models.Sharepoint;
using System.Text.Json;

namespace ComplianceSysApi.Api.Controllers
{
    /// <summary>
    /// Controller quản lý ComplDetail (CRUD API).
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/compliances")]
    public class ComplCompliancesController : ControllerBase
    {
        private readonly IComplCompliancesService _complDetailService;
        private ISharepointService _sharepointService;

        private readonly IComplConfigService _complConfigService;

        public ComplCompliancesController(IComplCompliancesService complDetailService, ISharepointService sharepointService, IComplConfigService complConfigService)
        {
            _complDetailService = complDetailService;
            _sharepointService = sharepointService;
            _complConfigService = complConfigService;
        }               

        [Authorize(Policy = "ComplianceDetail.ReadOne")]
        [HttpGet("get-by-id/{id:long}")]
        public async Task<IActionResult> GetById(long id)
        {
            var list = await _complDetailService.GetComplianceDetailById(id);
            return Ok(ApiResponse<ComplComplianceDetailResponseDto>.Ok(list, "Get compliance detail successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.ReadAll")]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var list = await _complDetailService.GetAllAsync();
            return Ok(ApiResponse<IEnumerable<ComplCompliances>>.Ok(list, "Get all compliance detail successfully"));
        }

        /// <summary>
        /// Lấy danh sách phân trang.
        /// </summary>
        /// <remarks>
        /// <b>Cách dùng: Request body</b><br/>
        /// <br/>
        /// <b>Like:</b>
        /// <code>{ "column": "Name", "operator": "like", "value": "abc" }</code><br/>
        /// → SQL: AND Name LIKE '%abc%'<br/>
        /// <br/>
        /// <b>Between:</b><br/>
        /// <code>{ "column": "CreatedDate", "operator": "between", "value": "2025-01-01,2025-01-31" }</code><br/>
        /// → SQL: AND CreatedDate BETWEEN '2025-01-01' AND '2025-01-31'<br/>
        /// <br/>
        /// <b>In:</b><br/>
        /// <code>{ "column": "Id", "operator": "in", "value": "1,2,3,4" }</code><br/>
        /// → SQL: AND Id IN (1,2,3,4)<br/>
        /// <br/>
        /// <b>So sánh:</b><br/>
        /// <code>{ "column": "Amount", "operator": ">=", "value": "1000" }</code><br/>
        /// → SQL: AND Amount >= 1000
        /// </remarks>
        [Authorize(Policy = "ComplianceDetail.ReadAll")]
        [HttpPost("get-all-in")]
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

            var result = await _complDetailService.GetPagedAsync(request, ct);
            return Ok(ApiResponse<PagedResult<ComplCompliances>>.Ok(result, "Get paged compliance detail successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.ReadAll")]
        [HttpPost("get-all")]
        public async Task<IActionResult> GetPagedFromSP(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = "Id",
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
                Filters = filters ?? []
            };

            var clientPageUrl = Request.Headers["X-Client-Page"].ToString();
            Log.Information("User called API from FE page: {ClientUrl}", clientPageUrl);
            string? userEmail = null;
            if (clientPageUrl.Contains("my-compliances", StringComparison.OrdinalIgnoreCase))
            {
                userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
            }

            var result = await _complDetailService.GetPagedSPAsync(request, userEmail, ct);
            return Ok(ApiResponse<PagedResult<ComplCompliancesResponseDto>>.Ok(result, "Get paged compliance detail successfully"));
        }

        /// <summary>
        /// Creates multiple compliance records with files and category.
        /// Each file can have its own ValidFrom/ValidTo dates and DocumentTypeId.
        /// </summary>
        [Authorize(Policy = "ComplianceDetail.Create")]
        [HttpPost("create-with-multiple-files-and-category")]
        [Consumes("multipart/form-data")]
        [RequestSizeLimit(500_000_000)] // optional: 500MB
        public async Task<IActionResult> CreateWithMultipleFilesAndCategoryAsync([FromForm] ComplComplianceMultipleFilesUploadForm form)
        {
            try
            {
                // Validate files
                //if (form.Files == null || form.Files.Count == 0)
                //{
                //    return BadRequest(ApiResponse<string>.Fail("At least one file is required"));
                //}

                // Parse category data
                var category = JsonSerializer.Deserialize<ComplCatCompliancesRequestDto>(
                    form.CategoryData,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                // Parse base compliance data
                var compliance = JsonSerializer.Deserialize<ComplCompliancesRequestDto>(
                    form.ComplianceData,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                // Parse file metadata
                var fileMetadataList = JsonSerializer.Deserialize<List<FileMetadataDto>>(
                    form.FileMetadata,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                // Validation
                if (category == null || compliance == null)
                {
                    return BadRequest(ApiResponse<string>.Fail("Invalid category or compliance data"));
                }

                if (fileMetadataList == null || fileMetadataList.Count == 0)
                {
                    return BadRequest(ApiResponse<string>.Fail("File metadata is required"));
                }

                // Build ComplComplianceFileItemDto list with tracking
                var fileItems = new List<ComplComplianceFileItemDto>();
                var fileInfoList = new List<(int index, string fileName)>();

                // Sắp xếp fileMetadataList theo fileIndex để đảm bảo thứ tự
                var sortedMetadata = fileMetadataList.OrderBy(m => m.FileIndex).ToList();

                int filePointer = 0; // Con trỏ để lấy file từ form.Files

                for (int i = 0; i < sortedMetadata.Count; i++)
                {
                    var metadata = sortedMetadata[i];
                    IFormFile? file = null;

                    // Chỉ lấy file nếu documentValue rỗng (tức là cần upload file)
                    if (string.IsNullOrWhiteSpace(metadata.DocumentValue) && form.Files != null && filePointer < form.Files.Count)
                    {
                        file = form.Files[filePointer];
                        filePointer++;
                    }

                    fileItems.Add(new ComplComplianceFileItemDto
                    {
                        Name = metadata.Name,
                        File = file,
                        ValidFrom = metadata.ValidFrom,
                        ValidTo = metadata.ValidTo,
                        DocumentTypeId = metadata.DocumentTypeId,
                        DocumentValue = metadata.DocumentValue
                    });

                    if (file != null)
                    {
                        fileInfoList.Add((i, file.FileName));
                    }
                    else
                    {
                        fileInfoList.Add((i, $"Document-{metadata.DocumentTypeId}-{metadata.DocumentValue}"));
                    }
                }

                // Get user email
                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

                // Track success and failures
                var successResults = new List<object>();
                var failedResults = new List<object>();

                string relevantComplianceId = string.IsNullOrWhiteSpace(category.ReferenceValue)
                                            ? DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString()
                                            : category.ReferenceValue + "-" + DateTimeOffset.UtcNow.ToUnixTimeMilliseconds().ToString();
                // Process each file individually to track success/failure
                for (int i = 0; i < fileItems.Count; i++)
                {
                    try
                    {
                        long unixMs = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds();
                        // Create a copy of the base compliance DTO for this specific file
                        var dtoCompliance = new ComplCompliancesRequestDto
                        {
                            Code = compliance.Code, // Will be auto-generated if empty
                            //Name = compliance.Name,
                            Name = fileItems[i].Name,
                            FileType = compliance.FileType,
                            Url = compliance.Url,
                            IdRef = compliance.IdRef,           // Will be set during upload

                            FileName = fileItems[i].File?.FileName,
                            DocumentTypeId = fileItems[i].DocumentTypeId, // Use file-specific DocumentTypeId
                            ValidFrom = fileItems[i].ValidFrom, // Use file-specific ValidFrom
                            ValidTo = fileItems[i].ValidTo,     // Use file-specific ValidTo
                            DocumentValue = fileItems[i].DocumentValue,

                            NumDayAlert = compliance.NumDayAlert,
                            RespGroupId = compliance.RespGroupId,
                            AlertGroupId = compliance.AlertGroupId,
                            RespGroupIds = compliance.RespGroupIds,
                            AlertGroupIds = compliance.AlertGroupIds,
                            Note = compliance.Note,
                            CategoryIds = compliance.CategoryIds,
                            ReferenceValue = compliance.ReferenceValue,
                            ReferenceType = compliance.ReferenceType,
                            DefinedType = compliance.DefinedType,
                            RequiredId = compliance.RequiredId,
                            LinkMaterialsJson = compliance.LinkMaterialsJson,
                            Documents = compliance.Documents,
                            RelevantComplianceId = relevantComplianceId
                        };

                        var complianceId = await _complDetailService.CreateWithFileAndCategoryAsync(
                            fileItems[i].File,
                            category,
                            dtoCompliance,
                            userEmail);

                        successResults.Add(new
                        {
                            Index = i,
                            FileName = fileInfoList[i].fileName,
                            ComplianceId = complianceId, //complianceIds.FirstOrDefault(),
                            Status = "Success"
                        });

                        Log.Information("Successfully created compliance for file {FileName} at index {Index}",
                            fileInfoList[i].fileName, i);
                    }
                    catch (Exception ex)
                    {
                        failedResults.Add(new
                        {
                            Index = i,
                            FileName = fileInfoList[i].fileName,
                            Error = ex.Message,
                            Status = "Failed"
                        });

                        Log.Error(ex, "Failed to create compliance for file {FileName} at index {Index}",
                            fileInfoList[i].fileName, i);
                    }
                }

                // Build response based on results
                var totalFiles = form.Files.Count;
                var totalSuccess = successResults.Count;
                var totalFailed = failedResults.Count;

                var responseData = new
                {
                    TotalFiles = totalFiles,
                    TotalSuccess = totalSuccess,
                    TotalFailed = totalFailed,
                    SuccessFiles = successResults,
                    FailedFiles = failedResults,
                    ComplianceIds = successResults.Select(r => ((dynamic)r).ComplianceId).ToList()
                };

                // If all failed, return error
                if (totalSuccess == 0)
                {
                    return StatusCode(500, ApiResponse<string>.Fail($"All {totalFiles} files failed to upload. Check FailedFiles for details."));
                }

                // If partial success, return warning with details
                if (totalFailed > 0)
                {
                    return Ok(ApiResponse<object>.Ok(
                        responseData,
                        $"Partial success: {totalSuccess} out of {totalFiles} files uploaded successfully. {totalFailed} file(s) failed."));
                }

                // All success
                return Ok(ApiResponse<object>.Ok(
                    responseData,
                    $"Successfully created {totalSuccess} compliance records"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error in CreateWithMultipleFilesAndCategoryAsync");
                return StatusCode(500, ApiResponse<string>.Fail($"Failed to create compliance records: {ex.Message}"));
            }
        }

        /// <summary>
        /// Creates a new compliance record with optional file upload and category.
        /// </summary>
        [Authorize(Policy = "ComplianceDetail.Create")]
        [HttpPost("create-with-file-and-category")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> CreateWithFileAndCategory([FromForm] ComplComplianceUploadForm form)
        {
            // Parse thủ công chuỗi JSON sang object
            var category = JsonSerializer.Deserialize<ComplCatCompliancesRequestDto>(form.CategoryData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            var compliance = JsonSerializer.Deserialize<ComplCompliancesRequestDto>(form.ComplianceData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (category == null || compliance == null)
                return BadRequest("Invalid JSON data");

            var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";
            var id = await _complDetailService.CreateWithFileAndCategoryAsync(form.File, category, compliance, userEmail);

            return Ok(ApiResponse<long>.Ok(id, "Created successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.Create")]
        [HttpPost("create-with-category-id")]
        public async Task<IActionResult> CreateWithCategoryId(long categoryId, [FromBody] ComplCompliancesRequestDto dto)
        {
            if (categoryId == 0)
                return BadRequest(ApiResponse<string>.Fail("Request CategoryId must > 0"));

            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            if (string.IsNullOrWhiteSpace(dto.IdRef))
                return BadRequest(ApiResponse<string>.Fail("Request IdRef body cannot be null"));

            var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

            var id = await _complDetailService.CreateWithCategoryIdAsync(categoryId, dto, userEmail);

            return Ok(ApiResponse<long>.Ok(id, "Created successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.Update")]
        [HttpPost("update-or-upgrade-version")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> UpdateCheckUpgradeVersionAsync([FromForm] ComplComplianceUploadForm form, CancellationToken ct = default)
        {
            // Parse thủ công chuỗi JSON sang object
            //var category = JsonSerializer.Deserialize<ComplCatCompliancesRequestDto>(form.CategoryData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
            try
            {
                var compliance = JsonSerializer.Deserialize<ComplCompliancesRequestDto>(form.ComplianceData, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                if (compliance == null)
                    return BadRequest("Invalid JSON data");

                var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

                await _complDetailService.UpdateCheckUpgradeVersionAsync(form.File, compliance, userEmail, ct);

                //await _complDetailService.UpdateCheckUpgradeVersionAsync(id, dto, userEmail);
                return Ok(ApiResponse<string>.Ok("", "Updated successfully"));
            }
            catch (Exception ex)
            {

                throw;
            }
        }

        [Authorize(Policy = "ComplianceDetail.Create")]
        [HttpPost]
        public async Task<IActionResult> Create([FromBody] ComplCompliancesRequestDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "system";

            var id = await _complDetailService.AddAsync(dto, userEmail);

            return Ok(ApiResponse<long>.Ok(id, "Created successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.Update")]
        [HttpPut("{id:int}")]
        public async Task<IActionResult> Update(int id, [FromBody] ComplCompliancesRequestDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "";

            await _complDetailService.UpdateAsync(id, dto, userEmail);
            return Ok(ApiResponse<string>.Ok("", "Updated successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.Update")]
        [HttpPost("update-addition-for")]
        public async Task<IActionResult> UpdateAdditionFor([FromBody] ComplComplianceEmailRequestDto dto)
        {
            if (dto == null)
                return BadRequest(ApiResponse<string>.Fail("Request body cannot be null"));

            var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "";

            await _complDetailService.UpdateAdditionEmailAsync(dto, userEmail);
            return Ok(ApiResponse<string>.Ok("", "Updated addtion emails for successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.Delete")]
        [HttpDelete("{id:int}")]
        public async Task<IActionResult> Delete(int id)
        {
            var userEmail = HttpContext.Items["UserEmail"]?.ToString() ?? "";

            await _complDetailService.DeleteAsync(id, userEmail);

            return Ok(ApiResponse<string>.Ok("ComplManagement deleted successfully", "Deleted successfully"));
        }

        /// <summary>
        /// Delete multiple ComplManagement entities by IDs.
        /// </summary>        
        [Authorize(Policy = "ComplianceDetail.Delete")]
        [HttpPost("delete-multi")]
        public async Task<IActionResult> DeleteMulti([FromBody] IEnumerable<long> ids, CancellationToken ct = default)
        {
            if (ids == null || !ids.Any())
                return BadRequest(ApiResponse<string>.Fail("No IDs provided for deletion"));

            await _complDetailService.DeleteMultiAsync(ids, ct);
            return Ok(ApiResponse<string>.Ok("compliance detail deleted successfully", "Deleted successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.ReadAll")]
        [HttpPost("get-by-category-ids")]
        public async Task<IActionResult> GetCompliancesByCategoryIds(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? sortColumn = "Id",
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
                Filters = filters ?? []
            };

            var result = await _complDetailService.GetCompliancesByCategoryIds(request, ct);
            return Ok(ApiResponse<PagedResult<ComplCompliancesResponseDto>>.Ok(result, "Get paged compliance detail successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.ReadAll")]
        [HttpGet("get-file-by-idref")]
        public async Task<IActionResult> GetFileByIds([FromQuery] string idRef = "0123PFEDHWRPQWSOBI2FFJYNWC663UC5VV", CancellationToken ct = default)
        {
            if (string.IsNullOrWhiteSpace(idRef))
                return BadRequest(ApiResponse<string>.Fail("Request IdRef body cannot be null"));

            var files = await _sharepointService.ReadFileWithMetaAsync(idRef);
            return Ok(ApiResponse<SharepointFileContent>.Ok(files, "Get paged compliance detail successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.ReadOne")]
        [HttpGet("get-relevant")]
        public async Task<IActionResult> GetByReleventId(string relevantId, long? skipId)
        {
            if (skipId == 0) skipId = null;
            var list = await _complDetailService.GetComplianceDetailByRelevantId(relevantId, skipId);
            return Ok(ApiResponse<PagedResult<ComplComplianceDetailResponseDto>>.Ok(list, "Get related compliances successfully"));
        }

        [Authorize(Policy = "ComplianceDetail.ReadOne")]
        [HttpGet("get-latest-version")]
        public async Task<IActionResult> GetLatestVersionPaged(string code, CancellationToken ct = default)
        {
            var request = new PagedRequest
            {
                Page = 1,
                PageSize = 1,
                SortColumn = "Id",
                SortOrder = "desc",
                Filters = [new FilterRequest { Column = "Code", Operator = "=", Value = code }]
            };

            var result = await _complDetailService.GetPagedAsync(request, ct);

            return Ok(ApiResponse<ComplCompliances>.Ok(result.Items.FirstOrDefault(), "Get last version compliance successfully"));
        }

    }
}
