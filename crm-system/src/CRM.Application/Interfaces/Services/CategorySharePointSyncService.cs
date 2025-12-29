using CRMSys.Application.Constants;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Shared.ExternalServices.Interfaces;
using Shared.ExternalServices.Models.Sharepoint;
using System.Text;

namespace CRMSys.Application.Services
{
    public class CategorySharePointSyncService : ICategorySharePointSyncService
    {
        private readonly ISharepointService _sharepointService;
        private readonly ICRMCategoryService _categoryService;

        public CategorySharePointSyncService(
            ISharepointService sharepointService,
            ICRMCategoryService categoryService)
        {
            _sharepointService = sharepointService;
            _categoryService = categoryService;
        }

        public async Task<IEnumerable<string>> GetOrphanedFoldersAsync(CancellationToken ct = default)
        {
            // Lấy tất cả các Category
            var categories = await _categoryService.GetAllAsync(ct);
            var categoryPaths = new HashSet<string>();

            if(categories == null || !categories.Any())
            {
                return Enumerable.Empty<string>();
            }

            // Build danh sách path của tất cả Category
            foreach (var category in categories)
            {
                var path = await BuildCategoryPathAsync(category, ct);
                categoryPaths.Add(path.ToLowerInvariant());
            }

            // Lấy tất cả folder từ SharePoint
            var folderTree = await _sharepointService.GetFolderTree(SharePointConstants.ROOT_FOLDER);
            if (folderTree == null)
            {
                return Enumerable.Empty<string>();
            }

            var orphanedFolders = new List<string>();
            await FindOrphanedFoldersRecursive(folderTree, string.Empty, categoryPaths, orphanedFolders);

            return orphanedFolders;
        }

        public async Task<bool> HasMatchingCategoryAsync(string folderPath, CancellationToken ct = default)
        {
            if (string.IsNullOrEmpty(folderPath) || !folderPath.StartsWith(SharePointConstants.ROOT_FOLDER, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            // Lấy relative path (bỏ ROOT_FOLDER)
            var relativePath = folderPath.Substring(SharePointConstants.ROOT_FOLDER.Length).Trim('/');
            if (string.IsNullOrEmpty(relativePath))
            {
                return true; // ROOT_FOLDER luôn được coi là hợp lệ
            }

            // Lấy tất cả categories
            var categories = await _categoryService.GetAllAsync(ct);

            if (categories == null || !categories.Any())
            {
                return false;
            }

            // Kiểm tra từng category
            foreach (var category in categories)
            {
                var categoryPath = await BuildCategoryPathAsync(category, ct);
                if (categoryPath.Equals(relativePath, StringComparison.OrdinalIgnoreCase))
                {
                    return true;
                }
            }

            return false;
        }

        private async Task<string> BuildCategoryPathAsync(CRMCategory category, CancellationToken ct = default)
        {
            return await _categoryService.GetCategoryPathAsync(category.Id, ct) ?? string.Empty;
        }

        private async Task FindOrphanedFoldersRecursive(
            SharepointFolderNode currentNode,
            string currentPath,
            HashSet<string> categoryPaths,
            List<string> orphanedFolders)
        {
            var fullPath = string.IsNullOrEmpty(currentPath)
                ? SharePointConstants.ROOT_FOLDER
                : $"{SharePointConstants.ROOT_FOLDER}/{currentPath}";

            // Bỏ qua ROOT_FOLDER
            if (!string.IsNullOrEmpty(currentPath))
            {
                var normalizedPath = currentPath.ToLowerInvariant();
                if (!categoryPaths.Contains(normalizedPath))
                {
                    orphanedFolders.Add(fullPath);
                }
            }

            // Duyệt đệ quy các thư mục con
            foreach (var child in currentNode.Children)
            {
                var childPath = string.IsNullOrEmpty(currentPath)
                    ? child.Name
                    : $"{currentPath}/{child.Name}";
                await FindOrphanedFoldersRecursive(child, childPath, categoryPaths, orphanedFolders);
            }
        }
    }
}