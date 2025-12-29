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
using Serilog;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Quotation service implementation with business logic
    /// </summary>
    public class QuotationService : BaseService<Quotation, long, CreateQuotationRequest>, IQuotationService
    {
        private readonly IQuotationRepository _quotationRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateQuotationRequest> _createValidator;
        private readonly IValidator<UpdateQuotationRequest> _updateValidator;

        public QuotationService(
            IRepository<Quotation, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateQuotationRequest> createValidator,
            IValidator<UpdateQuotationRequest> updateValidator,
            IQuotationRepository quotationRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _quotationRepository = quotationRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        /// <summary>
        /// Query quotations with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<QuotationResponse>> QueryAsync(QuotationQueryRequest request, CancellationToken ct = default)
        {
            var result = await _quotationRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<QuotationResponse>>(result.Items);

            return new PagedResult<QuotationResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get quotation by ID
        /// </summary>
        public new async Task<QuotationResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var quotation = await base.GetByIdAsync(id, ct);
                return _mapper.Map<QuotationResponse>(quotation);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Create new quotation with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateQuotationRequest request, string userEmail, CancellationToken ct = default)
        {
            // Business rules validation
            if (request.TotalAmount.HasValue && request.TotalAmount.Value <= 0)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.TotalAmount), "Total amount must be greater than zero.")
                });
            }

            if (request.ValidUntil.HasValue && request.ValidUntil.Value < DateTime.UtcNow.Date)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.ValidUntil), "Valid until date cannot be in the past.")
                });
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing quotation
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateQuotationRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }


            if (request.TotalAmount.HasValue && request.TotalAmount.Value <= 0)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.TotalAmount), "Total amount must be greater than zero.")
                });
            }

            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreateQuotationRequest>(request), userEmail, ct);
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
        /// Delete quotation by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var quotation = await GetByIdAsync(id);
            if (quotation == null)
                return false;

            // Business rule: Don't delete accepted quotations
            if (quotation.Status == "accepted")
            {
                throw new InvalidOperationException("Cannot delete an accepted quotation.");
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
