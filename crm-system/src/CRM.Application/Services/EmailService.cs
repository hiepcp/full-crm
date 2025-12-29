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
    /// Email service implementation with business logic
    /// </summary>
    public class EmailService : BaseService<Email, long, CreateEmailRequest>, IEmailService
    {
        private readonly IEmailRepository _emailRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateEmailRequest> _createValidator;
        private readonly IValidator<UpdateEmailRequest> _updateValidator;

        public EmailService(
            IRepository<Email, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateEmailRequest> createValidator,
            IValidator<UpdateEmailRequest> updateValidator,
            IEmailRepository emailRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _emailRepository = emailRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        /// <summary>
        /// Query emails with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<EmailResponse>> QueryAsync(EmailQueryRequest request, CancellationToken ct = default)
        {
            var result = await _emailRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<EmailResponse>>(result.Items);

            return new PagedResult<EmailResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get email by ID
        /// </summary>
        public new async Task<EmailResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var email = await base.GetByIdAsync(id, ct);
                return _mapper.Map<EmailResponse>(email);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Create new email with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateEmailRequest request, string userEmail, CancellationToken ct = default)
        {
            // Additional business validation
            if (string.IsNullOrWhiteSpace(request.Subject))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Subject), "Email subject is required.")
                });
            }

            // Business rules validation
            if (string.IsNullOrWhiteSpace(request.ToRecipients))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.ToRecipients), "At least one recipient is required.")
                });
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing email
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateEmailRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Additional business validation
            if (!string.IsNullOrEmpty(request.Subject) && string.IsNullOrWhiteSpace(request.Subject))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Subject), "Email subject cannot be empty if provided.")
                });
            }

            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreateEmailRequest>(request), userEmail, ct);
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
        /// Delete email by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var email = await GetByIdAsync(id);
            if (email == null)
                return false;

            // Business rule: Don't delete sent emails
            // if (email.Status == "sent")
            // {
            //     throw new InvalidOperationException("Cannot delete a sent email.");
            // }

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
