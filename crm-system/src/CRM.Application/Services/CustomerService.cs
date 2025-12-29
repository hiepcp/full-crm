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
    /// Customer service implementation with business logic
    /// </summary>
    public class CustomerService : BaseService<Customer, long, CreateCustomerRequest>, ICustomerService
    {
        private readonly ICustomerRepository _customerRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateCustomerRequest> _createValidator;
        private readonly IValidator<UpdateCustomerRequest> _updateValidator;

        public CustomerService(
            IRepository<Customer, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateCustomerRequest> createValidator,
            IValidator<UpdateCustomerRequest> updateValidator,
            ICustomerRepository customerRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _customerRepository = customerRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        /// <summary>
        /// Query customers with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<CustomerResponse>> QueryAsync(CustomerQueryRequest request, CancellationToken ct = default)
        {
            var result = await _customerRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<CustomerResponse>>(result.Items);

            return new PagedResult<CustomerResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get customer by ID
        /// </summary>
        public new async Task<CustomerResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var customer = await base.GetByIdAsync(id, ct);
                return _mapper.Map<CustomerResponse>(customer);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Get deals by customer ID
        /// </summary>
        /// <param name="customerId">The customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of deal responses or null if not found</returns>
        public async Task<IEnumerable<DealResponse?>?> GetDealsByCustomerAsync(long customerId, CancellationToken ct = default)
        {
            try
            {
                var deals = await _customerRepository.GetDealsByCustomerAsync(customerId, ct);
                return _mapper.Map<IEnumerable<DealResponse?>>(deals);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Get leads by customer ID
        /// </summary>
        /// <param name="customerId">The customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of lead responses or null if not found</returns>
        public async Task<IEnumerable<LeadResponse?>> GetLeadsByCustomerAsync(long customerId, CancellationToken ct = default)
        {
            try
            {
                var leads = await _customerRepository.GetLeadsByCustomerAsync(customerId, ct);
                return _mapper.Map<IEnumerable<LeadResponse?>>(leads);
            }
            catch (KeyNotFoundException)
            {
                Log.Error("Customer with ID {CustomerId} not found when fetching leads.", customerId);
                throw;
            }
        }

        /// <summary>
        /// Get contacts by customer ID
        /// </summary>
        /// <param name="customerId">The customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of contact responses or null if not found</returns>
        public async Task<IEnumerable<ContactResponse?>> GetContactsByCustomerAsync(long customerId, CancellationToken ct = default)
        {
            try
            {
                var contacts = await _customerRepository.GetContactsByCustomerAsync(customerId, ct);
                return _mapper.Map<IEnumerable<ContactResponse?>>(contacts);
            }
            catch (KeyNotFoundException ex)
            {
                Log.Error(ex, "Error fetching contacts for customer ID {CustomerId}", customerId);
                throw;
            }
        }

        /// <summary>
        /// Get activities by customer ID
        /// </summary>
        /// <param name="customerId">The customer ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Collection of activity responses or null if not found</returns>
        public async Task<IEnumerable<ActivityResponse?>> GetActivitiesByCustomerAsync(long customerId, CancellationToken ct = default)
        {
            try
            {
                var activities = await _customerRepository.GetActivitiesByCustomerAsync(customerId, ct);
                return _mapper.Map<IEnumerable<ActivityResponse?>>(activities);
            }
            catch (KeyNotFoundException ex)
            {
                Log.Error(ex, "Error fetching activities for customer ID {CustomerId}", customerId);
                throw;
            }
        }

        /// <summary>
        /// Create new customer with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateCustomerRequest request, string userEmail, CancellationToken ct = default)
        {
            // Additional business validation
            if (string.IsNullOrWhiteSpace(request.Name))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Name), "Customer name is required.")
                });
            }

            // Business rules validation
            if (!string.IsNullOrEmpty(request.Email) && !request.Email.Contains("@"))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Email), "Invalid email format.")
                });
            }

            if (!string.IsNullOrEmpty(request.Domain) && !request.Domain.Contains("."))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Domain), "Invalid domain format.")
                });
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing customer
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateCustomerRequest request, string userEmail, CancellationToken ct = default)
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
                    new ValidationFailure(nameof(request.Name), "Customer name cannot be empty if provided.")
                });
            }

            if (!string.IsNullOrEmpty(request.Email) && !request.Email.Contains("@"))
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Email), "Invalid email format.")
                });
            }


            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreateCustomerRequest>(request), userEmail, ct);
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
        /// Delete customer by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var customer = await GetByIdAsync(id);
            if (customer == null)
                return false;

            // Business rule: Don't delete customers with active deals
            // This would need to be checked against deals repository
            // For now, just allow deletion

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
