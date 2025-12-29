using AutoMapper;
using CRMSys.Application.Constants;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using Shared.Dapper.Interfaces;
using FluentValidation.Results;
using Shared.ExternalServices.Interfaces;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;
using Microsoft.Extensions.Logging;

namespace CRMSys.Application.Services
{
    public class CRMCategoryService
        : BaseService<CRMCategory, long, CRMCategoryRequestDto>, ICRMCategoryService
    {
        private readonly ICRMCategoryRepository _categoryRepository;
        private readonly IRepository<CRMCategory, long> _repository;
        private readonly ISharepointService _sharepointService;
        private readonly IMapper _mapper;

        public CRMCategoryService(
            ICRMCategoryRepository categoryRepository,
            IRepository<CRMCategory, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CRMCategoryRequestDto> validator,
            ISharepointService sharepointService
        ) : base(repository, unitOfWork, mapper, validator)
        {
            _categoryRepository = categoryRepository;
            _repository = repository;
            _sharepointService = sharepointService;
            _mapper = mapper;
        }

        public override async Task<long> AddAsync(CRMCategoryRequestDto dto, string userEmail, CancellationToken ct = default)
        {
            // Validate unique name
            var isUnique = await _categoryRepository.CheckUniqueNameAsync(dto.Name!, dto.ParentId, null, ct);
            if (!isUnique)
            {
                throw new ValidationException(new[] { new ValidationFailure(nameof(dto.Name), "Category name already exists at the same level.") });
            }

            // Start transaction for the entire operation (database + SharePoint)
            try
            {
                // Create category entity (replicate BaseService.AddAsync logic without commit)
                var entity = _mapper.Map<CRMCategory>(dto);

                // Set audit fields manually (replicating BaseService logic)
                var now = DateTime.UtcNow;
                entity.CreatedOn = now;
                entity.CreatedBy = userEmail;
                entity.UpdatedOn = now;
                entity.UpdatedBy = userEmail;

                var categoryId = await _repository.AddAsync(entity, ct);

                // Build SharePoint folder path
                var folderPath = await BuildSharePointFolderPathAsync(dto.Name!, dto.ParentId, ct);

                // Create SharePoint folder
                await _sharepointService.CreateFolder(folderPath);

                return categoryId;
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to create SharePoint folder: {ex.Message}");
            }
        }

        public override async Task UpdateAsync(long id, CRMCategoryRequestDto dto, string userEmail, CancellationToken ct = default)
        {
            // Validate unique name
            var isUnique = await _categoryRepository.CheckUniqueNameAsync(dto.Name!, dto.ParentId, id, ct);
            if (!isUnique)
            {
                throw new ValidationException(new[] { new ValidationFailure(nameof(dto.Name), "Category name already exists at the same level.") });
            }

            // Get old category for comparison
            var oldCategory = await GetByIdAsync(id, ct);
            if (oldCategory == null)
            {
                throw new ValidationException(new[] { new ValidationFailure("Id", "Category not found.") });
            }

            try
            {
                // Handle SharePoint folder update
                if (oldCategory.Name != dto.Name || oldCategory.ParentId != dto.ParentId)
                {
                    // Get old and new paths
                    var oldPath = await BuildSharePointFolderPathAsync(oldCategory.Name, oldCategory.ParentId, ct);
                    var newPath = await BuildSharePointFolderPathAsync(dto.Name, dto.ParentId, ct);

                    if (oldCategory.ParentId == dto.ParentId)
                    {
                        // Only name changed - rename folder
                        await _sharepointService.RenameFolderByPathAsync(oldPath, dto.Name);
                    }
                    else
                    {
                        // Parent changed - create new folder structure
                        await _sharepointService.CreateFolder(newPath);
                        // Note: Old folder is preserved to prevent data loss
                    }
                }

                // Update category in database
                await base.UpdateAsync(id, dto, userEmail, ct);
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to update SharePoint folder: {ex.Message}");
            }
        }

        public override async Task DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            // Note: We're not deleting SharePoint folders when categories are deleted
            // This is a safety measure to prevent accidental deletion of documents
            await base.DeleteAsync(id, userEmail, ct);
        }

        private async Task<string> BuildSharePointFolderPathAsync(string categoryName, long? parentId, CancellationToken ct = default)
        {
            var path = new System.Text.StringBuilder(SharePointConstants.ROOT_FOLDER);

            if (parentId.HasValue)
            {
                var parentPath = await GetCategoryPathAsync(parentId.Value, ct);
                if (!string.IsNullOrEmpty(parentPath))
                {
                    path.Append("/").Append(parentPath);
                }
            }

            path.Append("/").Append(categoryName);
            return path.ToString();
        }

        // Helper method to build category path
        public async Task<string?> GetCategoryPathAsync(long value, CancellationToken ct = default)
        {
            var category = await GetByIdAsync(value, ct);
            if (category == null) return null;

            var path = category.Name;

            if (category.ParentId.HasValue)
            {
                var parentPath = await GetCategoryPathAsync(category.ParentId.Value, ct);
                if (!string.IsNullOrEmpty(parentPath))
                {
                    path = $"{parentPath}/{path}";
                }
            }

            return path;
        }

        public async Task<PagedResult<CRMCategoryResponseDto>> GetPagedAsync(PagedRequest request, CancellationToken ct = default)
        {
            // Get the paged result from base implementation
            var pagedResult = await base.GetPagedAsync(request, ct);
            
            // Get unique parent IDs from the paged items
            var parentIds = pagedResult.Items
                .Where(c => c.ParentId.HasValue)
                .Select(c => c.ParentId!.Value)
                .Distinct()
                .ToList();

            // If there are parents to look up
            var parentDict = new Dictionary<long, string>();
            if (parentIds.Any())
            {
                // Create a request to get only the parent categories
                var parentRequest = new PagedRequest
                {
                    Page = 1,
                    PageSize = parentIds.Count,
                    Filters = new List<FilterRequest>
                    {
                        new FilterRequest
                        {
                            Column = "Id",
                            Operator = "in",
                            Value = string.Join(",", parentIds)
                        }
                    }
                };

                // Get parent categories
                var parentResult = await base.GetPagedAsync(parentRequest, ct);
                parentDict = parentResult.Items.ToDictionary(c => c.Id, c => c.Name)!;
            }
            
            // Map to response DTOs and set parent names
            var responseItems = _mapper.Map<List<CRMCategoryResponseDto>>(pagedResult.Items);
            foreach (var item in responseItems)
            {
                var category = pagedResult.Items.First(c => c.Id == item.Id);
                if (category.ParentId.HasValue && parentDict.TryGetValue(category.ParentId.Value, out var parentName))
                {
                    item.ParentName = parentName;
                }
            }

            return new PagedResult<CRMCategoryResponseDto>
            {
                Items = responseItems,
                TotalCount = pagedResult.TotalCount
            };
        }
    }
}
