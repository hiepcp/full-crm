using CRMSys.Application.Constants;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Shared.AuthN.Common;
using Shared.ExternalServices.Interfaces;
using System.Collections.Generic;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for SharePoint integration (file and folder management)
    /// </summary>
    [Route("api/sharepoint")]
    [ApiController]
    public class SharePointController : ControllerBase
    {
        private ISharepointService _sharepointService;
        private ICRMUploadService _CRMUploadService;

        /// <summary>
        /// Init
        /// </summary>
        /// <param name="sharepointService"></param>
        /// <param name="CRMUploadService"></param>
        public SharePointController(ISharepointService sharepointService, ICRMUploadService CRMUploadService)
        {
            _sharepointService = sharepointService;
            _CRMUploadService = CRMUploadService;
        }

        /// <summary>
        /// Lấy tất cả files và folders từ SharePoint
        /// </summary>
        /// <param name="folder">Đường dẫn folder (mặc định: DEV/CRM)</param>
        /// <returns>Cây thư mục files và folders</returns>
        [HttpGet("get-all-files-folders")]
        public async Task<IActionResult> GetAllFiles(string folder = "DEV/CRM")
        {
            try
            {
                var tree = await _sharepointService.GetAllFilesAndFolders(folder);

                // In ra JSON
                var json = JsonConvert.SerializeObject(tree, Formatting.Indented);

                return Ok(json);
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// Lấy cây thư mục folders từ SharePoint
        /// </summary>
        /// <param name="folder">Đường dẫn folder (mặc định: DEV/CRM)</param>
        /// <returns>Cây thư mục folders</returns>
        [HttpGet("get-all-folders")]
        public async Task<IActionResult> GetAll(string folder = "DEV/CRM")
        {
            try
            {
                var tree = await _sharepointService.GetFolderTree(folder);

                // In ra JSON
                var json = JsonConvert.SerializeObject(tree, Formatting.Indented);

                return Ok(json);
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// Lấy List of các thư mục con trong một thư mục SharePoint cụ thể.
        /// </summary>
        /// <param name="folderPath">Đường dẫn thư mục cha trong SharePoint (ví dụ: DEV/CRM)</param>
        /// <returns>List of các thư mục con với thông tin Id, Name, Path, HasChildren</returns>
        [HttpGet("get-folders")]
        public async Task<IActionResult> GetFolders([FromQuery] string folderPath)
        {
            var folders = await _sharepointService.GetFolders(folderPath);
            return Ok(folders.Select(f => new
            {
                f.Id,
                f.Name,
                Path = $"{folderPath}/{f.Name}",
                HasChildren = f.Folder?.ChildCount > 0 // Graph tr? v? s? con
            }));
        }

        /// <summary>
        /// Create new folder trong SharePoint
        /// </summary>
        /// <param name="folder">Đường dẫn folder cần tạo (mặc định: DEV/CRM)</param>
        /// <returns>tạo folder</returns>
        [HttpGet("create-folder")]
        public async Task<IActionResult> CreateFolder(string folder = "DEV/CRM")
        {
            try
            {
                var rs = await _sharepointService.CreateFolder(folder);
                return Ok(rs);
            }
            catch (Exception)
            {
                throw;
            }
        }

        /// <summary>
        /// Upload file lên SharePoint (test endpoint)
        /// </summary>
        /// <param name="request">Upload file request chứa file và folder path</param>
        /// <returns>upload file</returns>
        [HttpPost("upload-test")]
        [Consumes("multipart/form-data")] // b?t bu?c d? Swagger hi?n th? file picker
        public async Task<IActionResult> UploadFile([FromForm] UploadFileRequest request)
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest("File is required.");

            using var stream = request.File.OpenReadStream();
            var fileNameForUpload = string.IsNullOrWhiteSpace(request.FileName)
                ? request.File.FileName
                : request.FileName;

            var result = await _sharepointService.UploadFile(
                request.FolderPath,
                fileNameForUpload,
                stream
            );

            return Ok(result);
        }

        /// <summary>
        /// Download file từ SharePoint
        /// </summary>
        /// <param name="fileId">SharePoint file ID</param>
        /// <returns>File content stream</returns>
        [HttpGet("download/{fileId}")]
        public async Task<IActionResult> DownloadFile(string fileId)
        {
            var file = await _sharepointService.ReadFileWithMetaAsync(fileId);
            return File(file.Content, file.ContentType, file.FileName);
        }

        /// <summary>
        /// Upload file lên SharePoint và lưu metadata vào database
        /// </summary>
        /// <param name="request">Upload file request chứa file và folder path</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>upload và lưu dữ liệu</returns>
        [HttpPost("upload")]
        [Consumes("multipart/form-data")] // b?t bu?c d? Swagger hi?n th? file picker
        public async Task<IActionResult> UploadToSharePointAndSaveData([FromForm] UploadFileRequest request, CancellationToken ct)
        {
            if (request.File == null || request.File.Length == 0)
                return BadRequest("File is required.");

            var result = await _CRMUploadService.UploadToSharePointAndSaveDataWithFileNameAsync(request, ct);

            return Ok(ApiResponse<string>.Ok(result, $"Upload file successfully"));            
        }

    }
}
