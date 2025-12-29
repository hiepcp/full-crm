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
    /// PipelineLog service implementation with business logic
    /// </summary>
    public class PipelineLogService : BaseService<PipelineLog, long, CreatePipelineLogRequest>, IPipelineLogService
    {
        private readonly IPipelineLogRepository _pipelineLogRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreatePipelineLogRequest> _createValidator;
        private readonly IValidator<UpdatePipelineLogRequest> _updateValidator;

        public PipelineLogService(
            IRepository<PipelineLog, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreatePipelineLogRequest> createValidator,
            IValidator<UpdatePipelineLogRequest> updateValidator,
            IPipelineLogRepository pipelineLogRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _pipelineLogRepository = pipelineLogRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        /// <summary>
        /// Query pipeline logs with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<PipelineLogResponse>> QueryAsync(PipelineLogQueryRequest request, CancellationToken ct = default)
        {
            var result = await _pipelineLogRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<PipelineLogResponse>>(result.Items);

            return new PagedResult<PipelineLogResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get pipeline log by ID
        /// </summary>
        public new async Task<PipelineLogResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var entity = await _pipelineLogRepository.GetByIdAsync(id, ct);
            return entity != null ? _mapper.Map<PipelineLogResponse>(entity) : null;
        }

        /// <summary>
        /// Create new pipeline log
        /// </summary>
        public async Task<long> CreateAsync(CreatePipelineLogRequest request, string userEmail, CancellationToken ct = default)
        {
            // Business validation
            if (request.DealId <= 0)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.DealId), "Deal ID must be greater than zero.")
                });
            }

            if (string.IsNullOrWhiteSpace(request.NewStage))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.NewStage), "New stage is required.")
                });
            }

            // Set default values if not provided
            if (!request.ChangedAt.HasValue)
            {
                request.ChangedAt = DateTime.UtcNow;
            }

            if (string.IsNullOrEmpty(request.ChangedBy))
            {
                request.ChangedBy = userEmail;
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing pipeline log
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdatePipelineLogRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Business validation
            if (!string.IsNullOrEmpty(request.NewStage) && string.IsNullOrWhiteSpace(request.NewStage))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.NewStage), "New stage cannot be empty if provided.")
                });
            }

            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreatePipelineLogRequest>(request), userEmail, ct);
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
        /// Delete pipeline log by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            await base.DeleteAsync(id, userEmail, ct);
            return true;
        }

        /// <summary>
        /// Get pipeline logs by deal ID
        /// </summary>
        public async Task<IEnumerable<PipelineLogResponse>> GetByDealIdAsync(long dealId, CancellationToken ct = default)
        {
            var entities = await _pipelineLogRepository.GetByDealIdAsync(dealId, ct);
            return _mapper.Map<IEnumerable<PipelineLogResponse>>(entities);
        }

        /// <summary>
        /// Get pipeline logs by stage
        /// </summary>
        public async Task<IEnumerable<PipelineLogResponse>> GetByStageAsync(string stage, CancellationToken ct = default)
        {
            var entities = await _pipelineLogRepository.GetByStageAsync(stage, ct);
            return _mapper.Map<IEnumerable<PipelineLogResponse>>(entities);
        }

        /// <summary>
        /// Log a stage change for a deal
        /// </summary>
        public async Task LogStageChangeAsync(long dealId, string? oldStage, string newStage, string? changedBy = null, string? notes = null, CancellationToken ct = default)
        {
            try
            {
                var pipelineLog = string.IsNullOrEmpty(oldStage)
                    ? PipelineLog.CreateInitial(dealId, newStage, changedBy, notes)
                    : PipelineLog.CreateStageChange(dealId, oldStage, newStage, changedBy, notes);

                await _pipelineLogRepository.CreateAsync(pipelineLog, ct);

                Log.Information("Pipeline log created for deal {DealId}: {OldStage} -> {NewStage}",
                    dealId, oldStage ?? "New", newStage);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error logging stage change for deal {DealId}", dealId);
                throw;
            }
        }
    }
}
