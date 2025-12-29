using System;
using System.Net;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Utils;
using CRMSys.Domain.Dynamics;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Shared.Dapper.Models;
using Shared.ExternalServices.Interfaces;
using Shared.ExternalServices.Models.Dynamics;
using Shared.ExternalServices.Exceptions;
using Shared.ExternalServices.Utilities;

namespace CRMSys.Application.Services
{
    public class CRMDynamicsService : ICRMDynamicsService
    {
        private readonly IDynamicService _dynamicService;
        private readonly DynamicsParameterManager _paramManager;
        private readonly ODataFilterParser<RSVNEcoResCategories> _parserDynCus;

        private static readonly IReadOnlyDictionary<int, (string Entity, string CodeColumn, string NameColumn)> EntityMappings = 
            new Dictionary<int, (string Entity, string CodeColumn, string NameColumn)>
            {
                { 1, ("RSVNDataAreas", "Id", "Name") },
                { 2, ("RSVNCustTableEntities", "AccountNum", "Name") },
                { 3, ("RSVNInventTables", "ProductCode", "ProductName" ) },
                { 4, ("RSVNAttributeTypeValueAlls", "AttributeValueRecId", "AttributeValueName") }
            };

        public CRMDynamicsService(
            IDynamicService dynamicService,
            DynamicsParameterManager paramManager,
            ODataFilterParser<RSVNEcoResCategories> parserDynCus)
        {
            _dynamicService = dynamicService;
            _paramManager = paramManager;
            _parserDynCus = parserDynCus;
        }

        public async Task<long> ImportProspectAsync(
            string name,
            string salesManager,
            string country,
            string phone,
            string email,
            CancellationToken ct = default)
        {
            // Build URL using DynamicsParameterManager to stay consistent with other calls
            var url = _paramManager
                .SetEntity("RSVNProspectImports")
                .BuildUrl();

            var payload = new
            {
                Name = name,
                SalesManager = "000051",
                Country = country,
                Phone = phone,
                Email = email
            };

            string responseBody;
            try
            {
                responseBody = await _dynamicService.PostAsync(url, payload, ct);
            }
            catch (DynamicsApiException ex)
            {
                throw new InvalidOperationException(ex.ResponseBody);
            }

            if (string.IsNullOrWhiteSpace(responseBody))
                throw new InvalidOperationException("Dynamics prospect import returned empty response");

            try
            {
                var dynObj = JsonConvert.DeserializeObject<dynamic>(responseBody);
                var custAccountValue = dynObj?.CustAccount ?? dynObj?["CustAccount"];
                var custAccountString = custAccountValue?.ToString();

                long custAccount = 0;
                if (string.IsNullOrWhiteSpace(custAccountString) || !long.TryParse(custAccountString, out custAccount))
                {
                    throw new InvalidOperationException("Dynamics prospect import did not return a valid CustAccount");
                }

                return custAccount;
            }
            catch (JsonException ex)
            {
                throw new InvalidOperationException($"Failed to parse Dynamics prospect import response: {ex.Message}", ex);
            }
        }

        private static bool IsDuplicateProspectError(DynamicsApiException ex)
        {
            // Dynamics returns a readable message in innererror.message when record exists
            if (ex.StatusCode != HttpStatusCode.Conflict && ex.StatusCode != HttpStatusCode.BadRequest)
                return false;

            var body = ex.ResponseBody ?? string.Empty;
            if (ContainsAlreadyExists(body))
                return true;

            if (TryExtractInnerErrorMessage(body, out var innerMessage) && ContainsAlreadyExists(innerMessage))
                return true;

            return false;
        }

        private static bool ContainsAlreadyExists(string? text) =>
            !string.IsNullOrWhiteSpace(text) &&
            text.IndexOf("already exists", StringComparison.OrdinalIgnoreCase) >= 0;

        private static bool TryExtractInnerErrorMessage(string body, out string message)
        {
            message = string.Empty;
            try
            {
                var token = JToken.Parse(body);
                message = token["error"]?["innererror"]?["message"]?.ToString()
                          ?? token["error"]?["message"]?.ToString()
                          ?? string.Empty;

                return !string.IsNullOrWhiteSpace(message);
            }
            catch (JsonException)
            {
                return false;
            }
        }

        public async Task<PagedResult<CRMDynReferenceResponseDto>> GetDynRefePagedAsync(
            int refeType, 
            PagedRequest request, 
            CancellationToken ct = default)
        {
            // Early return if invalid reference type
            if (!EntityMappings.TryGetValue(refeType, out var mapping))
            {
                return new PagedResult<CRMDynReferenceResponseDto>
                {
                    Items = new List<CRMDynReferenceResponseDto>(),
                    TotalCount = 0
                };
            }

            var filterString = BuildFilterString(request.Filters, mapping);
            ConfigureQueryParameters(mapping.Entity, filterString, request);

            var url = _paramManager.EnableCount().BuildUrl();
            var dataDyn = await _dynamicService.QueryAsync(url);
            if (string.IsNullOrEmpty(dataDyn))
            {
                return new PagedResult<CRMDynReferenceResponseDto> { Items = new List<CRMDynReferenceResponseDto>(), TotalCount = 0 };
            }

            var dynResponse = JsonConvert.DeserializeObject<dynamic>(dataDyn);
            var totalCount = (int)dynResponse!["@odata.count"];
            var items = MapDynamicsResponse(dynResponse, refeType);

            return new PagedResult<CRMDynReferenceResponseDto>
            {
                Items = items,
                TotalCount = totalCount
            };
        }

        private string BuildFilterString(List<FilterRequest>? filters, (string Entity, string CodeColumn, string NameColumn) mapping)
        {
            // Early return for null or empty filters
            if (filters == null || !filters.Any())
                return string.Empty;

            // Skip empty or null column filters
            var validFilters = filters.Where(f => !string.IsNullOrWhiteSpace(f.Column)).ToList();
            if (!validFilters.Any())
                return string.Empty;

            var filtersByType = validFilters.GroupBy(f => f.Column.ToLower() switch
            {
                "code" or "id" => "code",
                "name" => "name",
                _ => "other"
            });

            var filterParts = new List<string>();
            var searchFilters = new List<string>();

            foreach (var group in filtersByType)
            {
                foreach (var filter in group)
                {
                    filter.Normalize();
                    
                    // Skip filters with null or empty values after normalization
                    if (filter.Value == null)
                        continue;

                    var columnName = group.Key switch
                    {
                        "code" => mapping.CodeColumn,
                        "name" => mapping.NameColumn,
                        _ => filter.Column
                    };

                    var odataOperator = ODataOperatorConverter.ToODataOperator(filter.Operator);

                    // Handle AttributeValueRecId as int, others as string
                    var dataType = columnName == "AttributeValueRecId" ? "Edm.Int32" : "Edm.String";
                    var formattedValue = ODataOperatorConverter.FormatValue(filter.Value, dataType, odataOperator);

                    var filterStr = $"{columnName} {odataOperator} {formattedValue}";

                    if (group.Key is "code" or "name")
                        searchFilters.Add(filterStr);
                    else
                        filterParts.Add(filterStr);
                }
            }

            // Add search filters with OR condition if any exist
            if (searchFilters.Any())
                filterParts.Add($"({string.Join(" or ", searchFilters)})");

            // Return empty if no valid filters were created
            if (!filterParts.Any())
                return string.Empty;

            return string.Join(" and ", filterParts);
        }

        private void ConfigureQueryParameters(string entity, string filterString, PagedRequest request)
        {
            _paramManager.SetEntity(entity);

            if (!string.IsNullOrEmpty(filterString))
                _paramManager.AddFilter(filterString);

            if (!string.IsNullOrEmpty(request.SortColumn))
            {
                var sortColumn = MapSortColumn(request.SortColumn, entity);
                _paramManager.SetOrderBy($"{sortColumn} {request.SortOrder}");
            }

            _paramManager.SetPaging(request.PageSize, (request.Page - 1) * request.PageSize);
        }

        private string MapSortColumn(string sortColumn, string entity) => 
            (sortColumn.ToLower(), entity) switch
            {
                ("code", "RSVNDataAreas") => "Id",
                ("code", "RSVNCustTableEntities") or ("id", "RSVNCustTableEntities") => "AccountNum",
                ("code", "RSVNInventTables") or ("id", "RSVNInventTables") => "ProductCode",
                ("name", "RSVNInventTables") => "ProductName",
                ("code", "RSVNAttributeTypeValueAlls") or ("id", "RSVNAttributeTypeValueAlls") => "AttributeValueRecId",
                ("name", "RSVNAttributeTypeValueAlls") => "AttributeValueName",
                _ => sortColumn
            };

        private List<CRMDynReferenceResponseDto> MapDynamicsResponse(dynamic dynResponse, int refeType)
        {
            var responseItems = new List<CRMDynReferenceResponseDto>();
            var items = ((JArray)dynResponse.value);

            switch (refeType)
            {
                case 1:
                    responseItems = items.ToObject<List<RSVNDataAreas>>()
                        ?.Select(x => new CRMDynReferenceResponseDto { Code = x.Id, Name = x.Name })
                        .ToList() ?? new();
                    break;

                //case 2:
                //    responseItems = items.ToObject<List<RSVNCustTableEntities>>()
                //        ?.Select(x => new CRMDynReferenceResponseDto { Code = x.AccountNum, Name = x.Name })
                //        .ToList() ?? new();
                //    break;

                case 3:
                    responseItems = items.ToObject<List<RSVNInventTables>>()
                        ?.Select(x => new CRMDynReferenceResponseDto { Code = x.ProductCode, Name = x.ProductName })
                        .ToList() ?? new();
                    break;

                case 4:
                    responseItems = items.ToObject<List<RSVNAttributeTypeValueAlls>>()
                        ?.Select(x => new CRMDynReferenceResponseDto 
                        { 
                            Code = x.AttributeValueRecId.ToString(), 
                            Name = $"{x.AttributeTypeName}: {x.AttributeValueName}" 
                        })
                        .ToList() ?? new();
                    break;
            }

            return responseItems;
        }
    }
}
