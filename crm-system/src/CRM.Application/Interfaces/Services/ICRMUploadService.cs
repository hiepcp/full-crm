using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Services
{
    public interface ICRMUploadService
    {
        Task<string> UploadToSharePointAndSaveDataAsync(UploadFileRequest request, CancellationToken ct);

        /// <summary>
        /// Uploads a file to SharePoint using the optional FileName from request (if provided) and saves metadata to database.
        /// </summary>
        Task<string> UploadToSharePointAndSaveDataWithFileNameAsync(UploadFileRequest request, CancellationToken ct);
    }
}
