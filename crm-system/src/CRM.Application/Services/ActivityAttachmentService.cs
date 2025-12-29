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
    public class ActivityAttachmentService : BaseService<ActivityAttachment, long, CreateActivityAttachmentRequest>, IActivityAttachmentService
    {
        private readonly IActivityAttachmentRepository _repository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateActivityAttachmentRequest> _createValidator;
        private readonly IValidator<UpdateActivityAttachmentRequest> _updateValidator;
        private readonly IValidator<ActivityAttachmentQueryRequest> _queryValidator;

        public ActivityAttachmentService(
            IRepository<ActivityAttachment, long> repositoryBase,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateActivityAttachmentRequest> createValidator,
            IValidator<UpdateActivityAttachmentRequest> updateValidator,
            IValidator<ActivityAttachmentQueryRequest> queryValidator,
            IActivityAttachmentRepository repository)
            : base(repositoryBase, unitOfWork, mapper, createValidator)
        {
            _repository = repository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _queryValidator = queryValidator;
        }

        public async Task<PagedResult<ActivityAttachmentResponse>> QueryAsync(ActivityAttachmentQueryRequest request, CancellationToken ct = default)
        {
            var validationResult = await _queryValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            var result = await _repository.QueryAsync(request, ct);
            var items = _mapper.Map<List<ActivityAttachmentResponse>>(result.Items);
            return new PagedResult<ActivityAttachmentResponse> { Items = items, TotalCount = result.TotalCount };
        }

        public new async Task<ActivityAttachmentResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var entity = await base.GetByIdAsync(id, ct);
            return entity != null ? _mapper.Map<ActivityAttachmentResponse>(entity) : null;
        }

        public async Task<IEnumerable<ActivityAttachmentResponse>> GetByActivityAsync(long activityId, CancellationToken ct = default)
        {
            var items = await _repository.GetByActivityAsync(activityId, ct);
            return _mapper.Map<IEnumerable<ActivityAttachmentResponse>>(items);
        }

        public async Task<long> CreateAsync(CreateActivityAttachmentRequest request, string userEmail, CancellationToken ct = default)
        {
            return await base.AddAsync(request, userEmail, ct);
        }

        public async Task<bool> UpdateAsync(long id, UpdateActivityAttachmentRequest request, string userEmail, CancellationToken ct = default)
        {
            var validation = await _updateValidator.ValidateAsync(request, ct);
            if (!validation.IsValid) throw new ValidationException(validation.Errors);

            var existing = await base.GetByIdAsync(id, ct);
            if (existing == null) return false;

            if (!string.IsNullOrEmpty(request.FileName)) existing.FileName = request.FileName;
            if (!string.IsNullOrEmpty(request.MimeType)) existing.MimeType = request.MimeType;
            if (!string.IsNullOrEmpty(request.FilePath)) existing.FilePath = request.FilePath;
            if (request.FileSize.HasValue) existing.FileSize = request.FileSize.Value;

            existing.UpdatedOn = DateTime.UtcNow;
            existing.UpdatedBy = userEmail;

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
            if (existing == null) return false;
            await base.DeleteAsync(id, userEmail, ct);
            return true;
        }
    }
}

