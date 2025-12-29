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
    /// Contact service implementation with business logic
    /// </summary>
    public class ContactService : BaseService<Contact, long, CreateContactRequest>, IContactService
    {
        private readonly IContactRepository _contactRepository;
        private readonly IMapper _mapper;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IValidator<CreateContactRequest> _createValidator;
        private readonly IValidator<UpdateContactRequest> _updateValidator;

        public ContactService(
            IRepository<Contact, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateContactRequest> createValidator,
            IValidator<UpdateContactRequest> updateValidator,
            IContactRepository contactRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _contactRepository = contactRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// Query contacts with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<ContactResponse>> QueryAsync(ContactQueryRequest request, CancellationToken ct = default)
        {
            var result = await _contactRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<ContactResponse>>(result.Items);

            return new PagedResult<ContactResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get contact by ID
        /// </summary>
        public new async Task<ContactResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var contact = await base.GetByIdAsync(id, ct);
                return _mapper.Map<ContactResponse>(contact);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Create new contact with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateContactRequest request, string userEmail, CancellationToken ct = default)
        {
            // Additional business validation
            if (string.IsNullOrWhiteSpace(request.FirstName) && string.IsNullOrWhiteSpace(request.LastName))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure("FirstName", "At least first name or last name is required.")
                });
            }

            // Business rules validation
            if (!string.IsNullOrEmpty(request.Email) && !request.Email.Contains("@"))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Email), "Invalid email format.")
                });
            }

            // Additional business validation
            if (!string.IsNullOrEmpty(request.Email))
            {
                var isUnique = await _contactRepository.IsEmailUniqueAsync(request.Email, null, ct);
                if (!isUnique)
                {
                    throw new ValidationException(new[] {
                        new ValidationFailure(nameof(request.Email), "Email already exists for another lead.")
                    });
                }
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing contact
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateContactRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Additional business validation
            if (!string.IsNullOrEmpty(request.FirstName) && string.IsNullOrWhiteSpace(request.FirstName) &&
                !string.IsNullOrEmpty(request.LastName) && string.IsNullOrWhiteSpace(request.LastName))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure("FirstName", "At least first name or last name is required if provided.")
                });
            }

            if (!string.IsNullOrEmpty(request.Email) && !request.Email.Contains("@"))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Email), "Invalid email format.")
                });
            }

            // Start transaction for the update operation
            await _unitOfWork.BeginTransactionAsync();

            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreateContactRequest>(request), userEmail, ct);
                await _unitOfWork.CommitAsync();
                return true;
            }
            catch (KeyNotFoundException)
            {
                await _unitOfWork.RollbackAsync();
                return false;
            }
            catch
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Delete contact by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var contact = await GetByIdAsync(id);
            if (contact == null)
                return false;

            // Business rule: Don't delete primary contacts
            // if (contact.IsPrimaryContact)
            // {
            //     throw new InvalidOperationException("Cannot delete a primary contact.");
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

        /// <summary>
        /// Get deals by contact ID
        /// </summary>
        /// <param name="contactId">The contact ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of deal responses or null if not found</returns>
        public async Task<IEnumerable<DealResponse>> GetDealsByContactAsync(long contactId, CancellationToken ct = default)
        {
            try
            {
                var deals = await _contactRepository.GetDealsByContactAsync(contactId, ct);
                return _mapper.Map<IEnumerable<DealResponse>>(deals);
            }
            catch (KeyNotFoundException)
            {
                return Enumerable.Empty<DealResponse>();
            }
        }

        /// <summary>
        /// Get activities by contact ID
        /// </summary>
        /// <param name="contactId">The contact ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of activity responses or null if not found</returns>
        public async Task<IEnumerable<ActivityResponse>> GetActivitiesByContactAsync(long contactId, CancellationToken ct = default)
        {
            try
            {
                var activities = await _contactRepository.GetActivitiesByContactAsync(contactId, ct);
                return _mapper.Map<IEnumerable<ActivityResponse>>(activities);
            }
            catch (KeyNotFoundException)
            {
                return Enumerable.Empty<ActivityResponse>();
            }
        }

        /// <summary>
        /// Set contact as primary for its customer
        /// </summary>
        public async Task<bool> SetAsPrimaryAsync(long id, CancellationToken ct = default)
        {
            var contact = await _contactRepository.GetByIdAsync(id, ct);
            if (contact == null)
                return false;

            // Unset other primary contacts for the same customer
            await _contactRepository.UnsetPrimaryAsync(contact.CustomerId, ct);

            // Set as primary
            await _contactRepository.SetAsPrimaryAsync(id, ct);
            await _unitOfWork.CommitAsync();

            return true;
        }
    }
}
