using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Shared.ExternalServices.Interfaces;

namespace CRMSys.Application.Services
{
    public class CRMUploadService : ICRMUploadService
    {
        private readonly ISharepointService _sharepointService;
        private readonly ICRMSharepointFileService _crmSharepointFileService;
        private const string SystemEmail = "system@crm.com";

        public CRMUploadService(
            ISharepointService sharepointService,
            ICRMSharepointFileService crmSharepointFileService)
        {
            _sharepointService = sharepointService;
            _crmSharepointFileService = crmSharepointFileService;
        }

        public async Task<string> UploadToSharePointAndSaveDataAsync(UploadFileRequest request, CancellationToken ct)
        {
            // Generate unique filename while preserving extension
            string originalFileName = request.File.FileName;
            string uniqueFileName = GetUniqueFileName(originalFileName);

            // Upload file to SharePoint with unique name
            using var stream = request.File.OpenReadStream();
            var result = await _sharepointService.UploadFile(
                request.FolderPath,
                uniqueFileName,
                stream
            );

            // Map the SharePoint result to ComplSharepointFile entity
            var crmFile = new CRMSharepointFile
            {
                ItemId = result!.Id,
                DriveId = result.ParentReference?.DriveId ?? "",
                Name = result.Name,
                WebUrl = result.WebUrl,
                DownloadUrl = result.WebUrl, // Using WebUrl as download URL
                MimeType = result.File?.MimeType,
                Size = result.Size != 0 ? (long?)long.Parse(result.Size.ToString()) : null,
                ETag = result.ETag,
                CTag = result.CTag,
                CreatedDateTime = result.CreatedDateTime,
                LastModifiedBy = result.LastModifiedBy?.User?.DisplayName,
                LastModifiedDateTime = result.LastModifiedDateTime,
                ParentId = result.ParentReference?.Id,
                ParentName = result.ParentReference?.Name,
                ParentPath = result.ParentReference?.Path,
                RawJson = System.Text.Json.JsonSerializer.Serialize(result)
            };

            // Save to database
            await _crmSharepointFileService.AddAsync(crmFile, SystemEmail, ct);

            return result.Id;
        }

        public async Task<string> UploadToSharePointAndSaveDataWithFileNameAsync(UploadFileRequest request, CancellationToken ct)
        {
            // Use custom file name if provided; otherwise fall back to the uploaded file's name
            string baseFileName = string.IsNullOrWhiteSpace(request.FileName)
                ? request.File.FileName
                : request.FileName;

            string uniqueFileName = GetUniqueFileName(baseFileName);

            using var stream = request.File.OpenReadStream();
            var result = await _sharepointService.UploadFile(
                request.FolderPath,
                uniqueFileName,
                stream
            );

            var crmFile = new CRMSharepointFile
            {
                ItemId = result!.Id,
                DriveId = result.ParentReference?.DriveId ?? "",
                Name = result.Name,
                WebUrl = result.WebUrl,
                DownloadUrl = result.WebUrl,
                MimeType = result.File?.MimeType,
                Size = result.Size != 0 ? (long?)long.Parse(result.Size.ToString()) : null,
                ETag = result.ETag,
                CTag = result.CTag,
                CreatedDateTime = result.CreatedDateTime,
                LastModifiedBy = result.LastModifiedBy?.User?.DisplayName,
                LastModifiedDateTime = result.LastModifiedDateTime,
                ParentId = result.ParentReference?.Id,
                ParentName = result.ParentReference?.Name,
                ParentPath = result.ParentReference?.Path,
                RawJson = System.Text.Json.JsonSerializer.Serialize(result)
            };


            await _crmSharepointFileService.AddAsync(crmFile, SystemEmail, ct);

            return result.Id;
        }

        /// <summary>
        /// Generates a unique filename by adding a timestamp and random string while preserving the original extension
        /// </summary>
        private string GetUniqueFileName(string originalFileName)
        {
            // Get file name without extension and the extension
            string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName);
            string extension = Path.GetExtension(originalFileName);

            // Generate timestamp in format yyyyMMddHHmmss
            string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");

            // Generate random string (6 characters)
            string randomString = Guid.NewGuid().ToString("N").Substring(0, 6);

            // Combine all parts: originalname_timestamp_random.extension
            string uniqueFileName = $"{fileNameWithoutExtension}_{timestamp}_{randomString}{extension}";

            return uniqueFileName;
        }
    }
}
