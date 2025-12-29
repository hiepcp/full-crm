using CRMSys.Application.Constants;
using CRMSys.Application.Dtos;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Utils;
using CRMSys.Domain.Dynamics;
using Microsoft.Extensions.Options;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Serilog;
using Shared.Dapper.Models;
using Shared.ExternalServices.Interfaces;
using Shared.ExternalServices.Utilities;
using System;
using System.Collections.Concurrent;

namespace CRMSys.Application.Services
{
    public class AllCRMService : IAllCRMService
    {
        private readonly IDynamicService _dynamicService;
        private readonly DynamicsParameterManager _paramManager;
        private readonly DynamicModelService _dynamicModelService;
        private readonly ICacheHelper _cacheHelper;
        //private readonly IMemoryCache _cache;
        private readonly TimeSpan _cacheExpiration;
        private readonly TimeSpan _cacheExpirationSo;
        private static readonly ConcurrentDictionary<int, ConcurrentBag<string>> _cacheKeysByRefType = new();

        public AllCRMService(IDynamicService dynamicService, DynamicsParameterManager paramManager,
            DynamicModelService dynamicModelService,
            // IMemoryCache cache, 
            ICacheHelper cacheHelper, IOptions<CacheSettings> cacheOptions)
        {
            _dynamicService = dynamicService;
            _paramManager = paramManager;
            _dynamicModelService = dynamicModelService;
            //_cache = cache;
            _cacheHelper = cacheHelper;

            var settings = cacheOptions.Value;
            _cacheExpiration = settings.CacheExpiration;
            _cacheExpirationSo = settings.CacheExpirationSo;
        }

        public async Task<PagedResult<T>> GetDataAsync<T>(int refType, PagedRequest request, CancellationToken ct = default)
        where T : RSVNModelBase, new()
        {
            try
            {
                // Generate cache key based on refType, modelType, page, and filters
                var cacheKey = GenerateCacheKey<T>(refType, request);

                // Try get from cache
                var cachedResult = await _cacheHelper.GetAsync<PagedResult<T>>(cacheKey);
                if (cachedResult != null)
                {
                    Log.Debug("Cache HIT for key: {CacheKey}", cacheKey);
                    return cachedResult;
                }

                Log.Debug("Cache miss for key: {CacheKey}", cacheKey);

                // Get model instance
                var modelInstance = await _dynamicModelService.GetModelInstance(refType);

                // Build filter from request
                var filterBuilder = new ODataFilterBuilder(modelInstance);

                if (request.Filters != null && request.Filters.Any())
                {
                    filterBuilder.AddFilters(request.Filters);
                }

                // gắn end hay or ở đây
                string filterString = filterBuilder.Build("or");

                // Set up query parameters
                _paramManager.SetEntity(modelInstance.EntityName);

                if (!string.IsNullOrEmpty(filterString))
                {
                    _paramManager.AddFilter(filterString);
                }

                _paramManager.SetPaging(request.PageSize, (request.Page - 1) * request.PageSize);

                // Add sorting
                // gắn cứng SO thì sort theo DeliveryDate
                if (modelInstance.ModelType == 5)
                {
                    string orderBy = $"{modelInstance.FilterableFields["DeliveryDate"]} {"desc"}";
                    _paramManager.SetOrderBy(orderBy);
                }
                else
                {
                    if (!string.IsNullOrEmpty(request.SortColumn))
                    {
                        if (modelInstance.FilterableFields.ContainsKey(request.SortColumn))
                        {
                            string orderBy = $"{modelInstance.FilterableFields[request.SortColumn]} {request.SortOrder}";
                            _paramManager.SetOrderBy(orderBy);
                        }
                    }
                }

                // Build URL and query
                string url = _paramManager.EnableCount().BuildUrl();
                var dataDyn = await _dynamicService.QueryAsync(url);

                if (string.IsNullOrEmpty(dataDyn))
                {
                    return CreateEmptyResult<T>();
                }

                // Parse response
                var dynResponse = JsonConvert.DeserializeObject<dynamic>(dataDyn);

                if (dynResponse?.value == null)
                {
                    return CreateEmptyResult<T>();
                }

                // Deserialize to specific type
                var items = ((JArray)dynResponse.value).ToObject<List<T>>();

                var result = new PagedResult<T>
                {
                    Items = items ?? new List<T>(),
                    TotalCount = (int?)dynResponse["@odata.count"] ?? 0
                };

                // Cache the result
                var cacheEx = refType == (int)ReferenceType.SalesOrder ? _cacheExpirationSo : _cacheExpiration;
                await _cacheHelper.SetAsync(cacheKey, result, refType, cacheEx);

                Log.Debug("Cached result for key: {CacheKey}", cacheKey);

                return result;

            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error in GetDataAsync for refType {RefType}", refType);
                throw ;
            }
        }

        public async Task<object> GetDataAsync(int refType, PagedRequest request, CancellationToken ct = default)
        {
            // Get model type dynamically
            var modelType = await _dynamicModelService.GetModelType(refType);

            // Create generic method
            var method = typeof(AllCRMService).GetMethod(
                nameof(GetDataAsync),
                1, // Generic parameter count
                new[] { typeof(int), typeof(PagedRequest), typeof(CancellationToken) }
            );

            var genericMethod = method.MakeGenericMethod(modelType);

            //// Invoke generic method
            //var task = (Task)genericMethod.Invoke(this, new object[] { refType, request, ct });
            //await task.ConfigureAwait(false);

            //// Get result
            //var resultProperty = task.GetType().GetProperty("Result");
            //var result = resultProperty.GetValue(task);

            //return result;
            // Invoke and await
            var task = (Task)genericMethod.Invoke(this, new object[] { refType, request, ct });
            await task;

            // Get result using dynamic
            dynamic taskResult = task;
            return taskResult.Result;
        }

        public async Task<object> GetDataByModalAsync(string modalName, PagedRequest request, CancellationToken ct = default)
        {
            // Find refType by modal name
            var refType = _dynamicModelService.GetRefTypeByModalName(modalName);

            if (refType == null)
            {
                throw new ArgumentException($"Modal '{modalName}' not found");
            }

            // Validate filters
            if (!await ValidateFilterRequest(refType.Value, request.Filters))
            {
                throw new ArgumentException("Invalid filter fields");
            }

            return await GetDataAsync(refType.Value, request, ct);
        }

        public async Task<Dictionary<string, string>> GetFilterableFields(int refType)
        {
            var model = await _dynamicModelService.GetModelInstance(refType);
            return model.FilterableFields;
        }

        public async Task<bool> ValidateFilterRequest(int refType, List<FilterRequest>? filters)
        {
            if (filters == null || !filters.Any())
                return true;

            var model = await _dynamicModelService.GetModelInstance(refType);
            var validFields = model.FilterableFields.Keys;

            return filters.All(f =>
            {
                // In hoa chữ cái đầu của f.Column
                var normalizedColumn = string.IsNullOrEmpty(f.Column)
                    ? f.Column
                    : char.ToUpper(f.Column[0]) + f.Column.Substring(1);

                return validFields.Contains(normalizedColumn);
            });
        }

        private PagedResult<T> CreateEmptyResult<T>()
        {
            return new PagedResult<T>
            {
                Items = Enumerable.Empty<T>(),
                TotalCount = 0
            };
        }

        #region Cache Key Generation        
        /// <summary>
        /// Generate cache key based on request parameters
        /// </summary>
        private string GenerateCacheKey<T>(int refType, PagedRequest request)
        {
            var modelTypeName = typeof(T).Name;

            var filtersHash = request.Filters != null && request.Filters.Any()
                ? string.Join("|", request.Filters
                    .OrderBy(f => f.Column) // Consistent ordering
                    .Select(f => $"{f.Column}:{f.Operator}:{f.Value}"))
                : "nofilter";

            var sortingHash = !string.IsNullOrEmpty(request.SortColumn)
                ? $"{request.SortColumn}:{request.SortOrder}"
                : "nosort";

            return $"AllCompliances:{refType}:{modelTypeName}:Page{request.Page}:Size{request.PageSize}:{filtersHash}:{sortingHash}";
        }
        #endregion
    }
}
