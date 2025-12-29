namespace CRMSys.Application.Interfaces.Services
{
    public interface ICategorySharePointSyncService
    {
        /// <summary>
        /// L?y danh s�ch c�c folder t?n t?i tr�n SharePoint nh?ng kh�ng c� trong Category
        /// </summary>
        /// <param name="ct">Token ?? h?y thao t�c</param>
        /// <returns>Danh s�ch ???ng d?n ??y ?? c?a c�c folder "orphaned"</returns>
        Task<IEnumerable<string>> GetOrphanedFoldersAsync(CancellationToken ct = default);
        
        /// <summary>
        /// Ki?m tra m?t folder path c� t??ng ?ng v?i Category kh�ng
        /// </summary>
        /// <param name="folderPath">???ng d?n folder c?n ki?m tra</param>
        /// <param name="ct">Token ?? h?y thao t�c</param>
        /// <returns>true n?u folder c� Category t??ng ?ng, false n?u kh�ng</returns>
        Task<bool> HasMatchingCategoryAsync(string folderPath, CancellationToken ct = default);
    }
}