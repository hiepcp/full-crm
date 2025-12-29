using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;

namespace CRMSys.Application.Services
{
    public class ActivityParticipantService : BaseService<ActivityParticipant, long, CreateActivityParticipantRequest>, IActivityParticipantService
    {
        private readonly IActivityParticipantRepository _repository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateActivityParticipantRequest> _createValidator;
        private readonly IValidator<UpdateActivityParticipantRequest> _updateValidator;
        private readonly IValidator<ActivityParticipantQueryRequest> _queryValidator;

        public ActivityParticipantService(
            IRepository<ActivityParticipant, long> repositoryBase,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateActivityParticipantRequest> createValidator,
            IValidator<UpdateActivityParticipantRequest> updateValidator,
            IValidator<ActivityParticipantQueryRequest> queryValidator,
            IActivityParticipantRepository repository)
            : base(repositoryBase, unitOfWork, mapper, createValidator)
        {
            _repository = repository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _queryValidator = queryValidator;
        }

        public async Task<PagedResult<ActivityParticipantResponse>> QueryAsync(ActivityParticipantQueryRequest request, CancellationToken ct = default)
        {
            var validationResult = await _queryValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            var result = await _repository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<ActivityParticipantResponse>>(result.Items);

            return new PagedResult<ActivityParticipantResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        public new async Task<ActivityParticipantResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var entity = await base.GetByIdAsync(id, ct);
            return entity != null ? _mapper.Map<ActivityParticipantResponse>(entity) : null;
        }

        public async Task<IEnumerable<ActivityParticipantResponse>> GetByActivityIdAsync(long activityId, CancellationToken ct = default)
        {
            var items = await _repository.GetByActivityIdAsync(activityId, ct);
            return _mapper.Map<IEnumerable<ActivityParticipantResponse>>(items);
        }

        public async Task<long> CreateAsync(CreateActivityParticipantRequest request, string userEmail, CancellationToken ct = default)
        {
            return await base.AddAsync(request, userEmail, ct);
        }

        public async Task<bool> UpdateAsync(long id, UpdateActivityParticipantRequest request, string userEmail, CancellationToken ct = default)
        {
            var validationResult = await _updateValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            var existing = await base.GetByIdAsync(id, ct);
            if (existing == null)
            {
                return false;
            }

            if (!string.IsNullOrEmpty(request.Role))
            {
                existing.Role = request.Role;
            }

            existing.UpdatedOn = DateTime.UtcNow;
            existing.UpdatedBy = userEmail;

            // Start transaction for the update operation

            try
            {
                await _repository.UpdateAsync(existing, ct);
                return true;
            }
            catch
            {
                throw;
            }
        }

        override
        public async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var existing = await base.GetByIdAsync(id, ct);
            if (existing == null)
            {
                return false;
            }

            await base.DeleteAsync(id, userEmail, ct);
            return true;
        }
    }
}

