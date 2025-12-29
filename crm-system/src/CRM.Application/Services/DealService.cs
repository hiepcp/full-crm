using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using FluentValidation.Results;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Serilog;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Deal service implementation with business logic
    /// </summary>
    public class DealService : BaseService<Deal, long, CreateDealRequest>, IDealService
    {
        private readonly IRepository<Deal, long> _repository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateDealRequest> _createValidator;
        private readonly IValidator<UpdateDealRequest> _updateValidator;
        private readonly IDealRepository _dealRepository;
        private readonly IGoalProgressCalculationService? _goalCalculationService;

        public DealService(
            IRepository<Deal, long> repository,
            IUnitOfWork unitOfWork,
            IDealRepository dealRepository,
            IMapper mapper,
            IValidator<CreateDealRequest> createValidator,
            IValidator<UpdateDealRequest> updateValidator,
            IGoalProgressCalculationService? goalCalculationService = null
            )
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _dealRepository = dealRepository;
            _createValidator = createValidator;
            _repository = repository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _goalCalculationService = goalCalculationService;
        }

        /// <summary>
        /// Query deals with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<DealResponse>> QueryAsync(DealQueryRequest request, CancellationToken ct = default)
        {
            var result = await _dealRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<DealResponse>>(result.Items);

            return new PagedResult<DealResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get deal by ID
        /// </summary>
        public new async Task<DealResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var deal = await base.GetByIdAsync(id, ct);
                return _mapper.Map<DealResponse>(deal);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Create new deal with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateDealRequest request, string userEmail, CancellationToken ct = default)
        {
            // Additional business validation
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Name), "Deal name is required.")
                });
            }

            // Business rules validation
            if (request.ExpectedRevenue.HasValue && request.ExpectedRevenue.Value <= 0)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.ExpectedRevenue), "Expected revenue must be greater than zero.")
                });
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing deal
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateDealRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Additional business validation
            if (!string.IsNullOrEmpty(request.Name) && string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Name), "Deal name cannot be empty if provided.")
                });
            }

            if (request.ExpectedRevenue.HasValue && request.ExpectedRevenue.Value <= 0)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.ExpectedRevenue), "Expected revenue must be greater than zero.")
                });
            }

            // Get existing deal to check if stage changed to "Closed Won"
            var existingDeal = await _dealRepository.GetByIdAsync(id, ct);
            var wasNotClosedWon = existingDeal != null && existingDeal.Stage != "Closed Won";
            var nowClosedWon = !string.IsNullOrEmpty(request.Stage) && request.Stage == "Closed Won";

            // Start transaction for the update operation

            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreateDealRequest>(request), userEmail, ct);

                // Trigger goal recalculation if deal was closed as won (US1: T036)
                if (wasNotClosedWon && nowClosedWon && _goalCalculationService != null)
                {
                    try
                    {
                        await _goalCalculationService.RecalculateGoalsForEntityAsync("deal", id, ct);
                        Log.Information("Triggered goal recalculation for deal {DealId} marked as Closed Won", id);
                    }
                    catch (Exception ex)
                    {
                        // Log but don't fail the deal update if goal recalculation fails
                        Log.Warning(ex, "Failed to trigger goal recalculation for deal {DealId}", id);
                    }
                }

                return true;
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
            catch
            {
                throw;
            }
        }

        /// <summary>
        /// Delete deal by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var deal = await GetByIdAsync(id);
            if (deal == null)
                return false;

            // Business rule: Don't delete closed deals
            if (deal.Stage == "Closed Won" || deal.Stage == "Closed Lost")
            {
                throw new InvalidOperationException("Cannot delete a closed deal.");
            }

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
    }
}
