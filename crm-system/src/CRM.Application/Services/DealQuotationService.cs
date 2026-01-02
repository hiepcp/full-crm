using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using FluentValidation.Results;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.ExternalServices.Interfaces;
using Shared.ExternalServices.Models;
using Shared.ExternalServices.Utilities;
using Newtonsoft.Json;
using Serilog;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// DealQuotation service implementation with business logic for managing deal-quotation relationships
    /// </summary>
    public class DealQuotationService : BaseService<DealQuotation, long, CreateDealQuotationRequest>, IDealQuotationService
    {
        private readonly IDealQuotationRepository _dealQuotationRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateDealQuotationRequest> _createValidator;
        private readonly IValidator<UpdateDealQuotationRequest> _updateValidator;
        private readonly IValidator<DealQuotationQueryRequest> _queryValidator;
        private readonly IDealRepository _dealRepository;
        private readonly IPipelineLogService _pipelineLogService;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IDynamicService _dynamicService;
        private readonly DynamicsParameterManager _dynamicsParamManager;

        public DealQuotationService(
            IRepository<DealQuotation, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateDealQuotationRequest> createValidator,
            IValidator<UpdateDealQuotationRequest> updateValidator,
            IValidator<DealQuotationQueryRequest> queryValidator,
            IDealQuotationRepository dealQuotationRepository,
            IDealRepository dealRepository,
            IPipelineLogService pipelineLogService,
            IDynamicService dynamicService,
            DynamicsParameterManager dynamicsParamManager)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _dealQuotationRepository = dealQuotationRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _queryValidator = queryValidator;
            _dealRepository = dealRepository;
            _pipelineLogService = pipelineLogService;
            _unitOfWork = unitOfWork;
            _dynamicService = dynamicService;
            _dynamicsParamManager = dynamicsParamManager;
        }

        /// <summary>
        /// Query deal quotations with filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<DealQuotationResponse>> QueryAsync(DealQuotationQueryRequest request, CancellationToken ct = default)
        {
            // Validate query request
            var validationResult = await _queryValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            var result = await _dealQuotationRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<DealQuotationResponse>>(result.Items);

            return new PagedResult<DealQuotationResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get deal quotation by ID
        /// </summary>
        public new async Task<DealQuotationResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var dealQuotation = await base.GetByIdAsync(id, ct);
                return _mapper.Map<DealQuotationResponse>(dealQuotation);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Create new deal quotation link with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateDealQuotationRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate create request
            var validationResult = await _createValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Business validation: Check if the link already exists
            var existingLinks = await _dealQuotationRepository.GetByDealIdAsync(request.DealId, ct);
            if (existingLinks.Any(dq => dq.QuotationNumber == request.QuotationNumber))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure("QuotationNumber", "This deal is already linked to the specified quotation.")
                });
            }

            // Business validation: Ensure DealId and QuotationNumber are valid
            if (request.DealId <= 0)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.DealId), "Deal ID must be a positive number.")
                });
            }

            if (string.IsNullOrWhiteSpace(request.QuotationNumber))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.QuotationNumber), "Quotation number is required.")
                });
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Bulk create multiple deal quotation links
        /// </summary>
        public async Task<IEnumerable<long>> BulkCreateAsync(IEnumerable<CreateDealQuotationRequest> requests, string userEmail, CancellationToken ct = default)
        {
            var requestList = requests.ToList();
            if (!requestList.Any())
            {
                return Enumerable.Empty<long>();
            }

            // Validate all requests
            var validationTasks = requestList.Select(req => _createValidator.ValidateAsync(req));
            var validationResults = await Task.WhenAll(validationTasks);

            var errors = validationResults
                .Where(result => !result.IsValid)
                .SelectMany(result => result.Errors)
                .ToList();

            if (errors.Any())
            {
                throw new ValidationException(errors);
            }

            // Business validation: Check for duplicates within the batch
            var duplicates = requestList
                .GroupBy(req => (req.DealId, req.QuotationNumber))
                .Where(group => group.Count() > 1)
                .Select(group => group.Key)
                .ToList();

            if (duplicates.Any())
            {
                var duplicateErrors = duplicates.Select(dup =>
                    new ValidationFailure("Requests",
                        $"Duplicate link found: Deal {dup.DealId} - Quotation {dup.QuotationNumber}")
                );
                throw new ValidationException(duplicateErrors);
            }

            // Start transaction for all database operations
            await _unitOfWork.BeginTransactionAsync();

            try
            {
                // Check for stage updates before creating new links
                var dealIds = requestList.Select(r => r.DealId).Distinct().ToList();

                foreach (var dealId in dealIds)
                {
                    // Get existing quotations count for this deal
                    var existingLinks = await _dealQuotationRepository.GetByDealIdAsync(dealId, ct);

                    // If no existing links (first time linking)
                    if (!existingLinks.Any())
                    {
                        var deal = await _dealRepository.GetByIdAsync(dealId, ct);
                        if (deal != null && deal.Stage == "Prospecting")
                        {
                            // Update stage to Quotation
                            deal.Stage = "Quotation";
                            deal.UpdatedBy = userEmail;
                            deal.UpdatedOn = DateTime.UtcNow;

                            await _dealRepository.UpdateAsync(deal, ct);

                            // Add pipeline log
                            await _pipelineLogService.LogStageChangeAsync(
                                dealId,
                                "Prospecting",
                                "Quotation",
                                userEmail,
                                "Stage automatically updated upon linking first quotation",
                                ct
                            );
                        }
                    }
                }

                // Convert to entities and bulk insert
                var entities = _mapper.Map<List<DealQuotation>>(requestList);

                // Set audit fields
                var now = DateTime.UtcNow;
                foreach (var entity in entities)
                {
                    entity.CreatedOn = now;
                    entity.CreatedBy = userEmail;
                    entity.UpdatedOn = now;
                    entity.UpdatedBy = userEmail;
                }

                await _dealQuotationRepository.BulkInsertAsync(entities, ct);

                // Commit transaction
                await _unitOfWork.CommitAsync();

                return entities.Select(e => e.Id).ToList();
            }
            catch
            {
                // Rollback transaction on error
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Update existing deal quotation link
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateDealQuotationRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Business validation: Check if the new link combination already exists (excluding current record)
            var existingLinks = await _dealQuotationRepository.GetByDealIdAsync(request.DealId, ct);
            if (existingLinks.Any(dq => dq.Id != id && dq.QuotationNumber == request.QuotationNumber))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure("QuotationNumber", "This deal is already linked to the specified quotation.")
                });
            }

            // Business validation: Ensure DealId and QuotationNumber are valid
            if (request.DealId <= 0)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.DealId), "Deal ID must be a positive number.")
                });
            }

            if (string.IsNullOrWhiteSpace(request.QuotationNumber))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.QuotationNumber), "Quotation number is required.")
                });
            }

            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreateDealQuotationRequest>(request), userEmail, ct);
                return true;
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
        }

        /// <summary>
        /// Delete deal quotation link by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            try
            {
                await base.DeleteAsync(id, userEmail);
                return true;
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
        }

        /// <summary>
        /// Get all quotations linked to a specific deal
        /// </summary>
        public async Task<IEnumerable<DealQuotationResponse>> GetByDealIdAsync(long dealId, CancellationToken ct = default)
        {
            var dealQuotations = await _dealQuotationRepository.GetByDealIdAsync(dealId, ct);
            return _mapper.Map<IEnumerable<DealQuotationResponse>>(dealQuotations);
        }

        /// <summary>
        /// Get all deals linked to a specific quotation
        /// </summary>
        public async Task<IEnumerable<DealQuotationResponse>> GetByQuotationNumberAsync(string quotationNumber, CancellationToken ct = default)
        {
            var dealQuotations = await _dealQuotationRepository.GetByQuotationNumberAsync(quotationNumber, ct);
            return _mapper.Map<IEnumerable<DealQuotationResponse>>(dealQuotations);
        }

        /// <summary>
        /// Delete all quotation links for a specific deal
        /// </summary>
        public async Task<int> DeleteByDealIdAsync(long dealId, string userEmail, CancellationToken ct = default)
        {
            // Business validation: Ensure dealId is valid
            if (dealId <= 0)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(dealId), "Deal ID must be a positive number.")
                });
            }

            return await _dealQuotationRepository.DeleteByDealIdAsync(dealId, ct);
        }

        /// <summary>
        /// Lấy danh sách quotations của deal kèm thông tin chi tiết từ Dynamics 365
        /// </summary>
        public async Task<IEnumerable<DealQuotationWithDynamicsDataResponse>> GetQuotationsWithDynamicsDataByDealIdAsync(long dealId, CancellationToken ct = default)
        {
            try
            {
                // Bước 1: Lấy deal-quotation links từ database
                var dealQuotationLinks = await GetByDealIdAsync(dealId, ct);

                if (!dealQuotationLinks.Any())
                {
                    return new List<DealQuotationWithDynamicsDataResponse>();
                }

                // Bước 2: Với mỗi quotation number, gọi Dynamics 365 để lấy chi tiết
                var result = new List<DealQuotationWithDynamicsDataResponse>();

                foreach (var link in dealQuotationLinks)
                {
                    try
                    {
                        // Query Dynamics 365 cho quotation cụ thể này
                        var dynamicsData = await GetDynamicsQuotationDataAsync(link.QuotationNumber, ct);

                        var response = new DealQuotationWithDynamicsDataResponse
                        {
                            DealQuotationId = link.Id,
                            DealId = link.DealId,
                            QuotationNumber = link.QuotationNumber,
                            CreatedOn = link.CreatedOn,

                            // Dynamics 365 data
                            QuotationName = dynamicsData?.SalesQuotationName,
                            SalesQuotationStatus = dynamicsData?.SalesQuotationStatus,
                            SalesQuotationAmount = dynamicsData?.QuotationTotalAmount,
                            SalesQuotationExpirationDate = dynamicsData?.SalesQuotationExpiryDate,
                            RequestingCustomerAccountNumber = dynamicsData?.RequestingCustomerAccountNumber
                        };

                        result.Add(response);
                    }
                    catch (Exception ex)
                    {
                        Log.Warning(ex, "Failed to fetch Dynamics data for quotation {QuotationNumber}", link.QuotationNumber);

                        // Fallback: return basic data nếu không lấy được từ Dynamics
                        result.Add(new DealQuotationWithDynamicsDataResponse
                        {
                            DealQuotationId = link.Id,
                            DealId = link.DealId,
                            QuotationNumber = link.QuotationNumber,
                            CreatedOn = link.CreatedOn,
                            SalesQuotationStatus = "unknown" // Status mặc định
                        });
                    }
                }

                return result.OrderByDescending(x => x.CreatedOn);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting quotations with dynamics data for deal {DealId}", dealId);
                throw;
            }
        }

        /// <summary>
        /// Helper method để lấy dữ liệu quotation từ Dynamics 365
        /// </summary>
        private async Task<Domain.Dynamics.SalesQuotationHeadersV2?> GetDynamicsQuotationDataAsync(string quotationNumber, CancellationToken ct)
        {
            try
            {
                // Build Dynamics query URL (tương tự như trong DynController)
                var filterStrings = new List<string>
                {
                    $"SalesQuotationNumber eq '{quotationNumber}'"
                };

                _dynamicsParamManager.SetEntity("SalesQuotationHeadersV2");

                foreach (var filter in filterStrings)
                {
                    _dynamicsParamManager.AddFilter(filter);
                }

                // Thêm filter quotation type như trong DynController
                _dynamicsParamManager.AddFilter("RSVNQuotationType eq Microsoft.Dynamics.DataEntities.RSVNQuotationTypeEnum'None'");

                var url = _dynamicsParamManager.EnableCount().BuildUrl();

                var data = await _dynamicService.QueryAsync(url);
                if (string.IsNullOrEmpty(data))
                {
                    return null;
                }

                var odataResponse = JsonConvert.DeserializeObject<Shared.ExternalServices.Models.OdataMapper<Domain.Dynamics.SalesQuotationHeadersV2>>(data);
                return odataResponse?.Items?.FirstOrDefault();
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "Error fetching quotation {QuotationNumber} from Dynamics", quotationNumber);
                return null;
            }
        }
    }
}





