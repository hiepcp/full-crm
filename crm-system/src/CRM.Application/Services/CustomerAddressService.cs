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

namespace CRMSys.Application.Services
{
    /// <summary>
    /// CustomerAddress service implementation with business logic
    /// </summary>
    public class CustomerAddressService : BaseService<CustomerAddress, long, CreateCustomerAddressRequest>, ICustomerAddressService
    {
        private readonly ICustomerAddressRepository _customerAddressRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateCustomerAddressRequest> _createValidator;
        private readonly IValidator<UpdateCustomerAddressRequest> _updateValidator;
        private readonly IUnitOfWork _unitOfWork;

        public CustomerAddressService(
            IRepository<CustomerAddress, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateCustomerAddressRequest> createValidator,
            IValidator<UpdateCustomerAddressRequest> updateValidator,
            ICustomerAddressRepository customerAddressRepository,
            ICustomerRepository customerRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _customerAddressRepository = customerAddressRepository;
            _customerRepository = customerRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// Query customer addresses with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<CustomerAddressResponse>> QueryAsync(CustomerAddressQueryRequest request, CancellationToken ct = default)
        {
            var result = await _customerAddressRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<CustomerAddressResponse>>(result.Items);

            return new PagedResult<CustomerAddressResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get customer address by ID
        /// </summary>
        public async Task<CustomerAddressResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var address = await _customerAddressRepository.GetByIdAsync(id, ct);
            return address != null ? _mapper.Map<CustomerAddressResponse>(address) : null;
        }

        /// <summary>
        /// Get all addresses for a specific customer
        /// </summary>
        public async Task<IEnumerable<CustomerAddressResponse>> GetByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            var addresses = await _customerAddressRepository.GetByCustomerIdAsync(customerId, ct);
            return _mapper.Map<IEnumerable<CustomerAddressResponse>>(addresses);
        }

        /// <summary>
        /// Get primary address for a specific customer and address type
        /// </summary>
        public async Task<CustomerAddressResponse?> GetPrimaryAddressAsync(long customerId, string? addressType = null, CancellationToken ct = default)
        {
            var address = await _customerAddressRepository.GetPrimaryAddressAsync(customerId, addressType, ct);
            return address != null ? _mapper.Map<CustomerAddressResponse>(address) : null;
        }

        /// <summary>
        /// Create new customer address with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateCustomerAddressRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate that customer exists
            var customerExists = await _customerRepository.ExistsAsync(request.CustomerId, ct);
            if (!customerExists)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.CustomerId), $"Customer with ID {request.CustomerId} does not exist.")
                });
            }

            // Map to entity
            var address = _mapper.Map<CustomerAddress>(request);
            address.CreatedBy = userEmail;
            address.CreatedOn = DateTime.UtcNow;

            // If setting as primary, unset other primary addresses of same type
            if (request.IsPrimary)
            {
                await _customerAddressRepository.UnsetPrimaryAsync(request.CustomerId, request.AddressType, ct);
            }

            // Create address
            var id = await _customerAddressRepository.CreateAsync(address, ct);
            await _unitOfWork.CommitAsync();

            return id;
        }

        /// <summary>
        /// Update existing customer address with validation
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateCustomerAddressRequest request, string userEmail, CancellationToken ct = default)
        {
            // Get existing address
            var existingAddress = await _customerAddressRepository.GetByIdAsync(id, ct);
            if (existingAddress == null)
                return false;

            // Apply updates
            if (request.AddressType != null)
                existingAddress.AddressType = request.AddressType;
            if (request.CompanyName != null)
                existingAddress.CompanyName = request.CompanyName;
            if (request.AddressLine != null)
                existingAddress.AddressLine = request.AddressLine;
            if (request.Postcode != null)
                existingAddress.Postcode = request.Postcode;
            if (request.City != null)
                existingAddress.City = request.City;
            if (request.Country != null)
                existingAddress.Country = request.Country;
            if (request.ContactPerson != null)
                existingAddress.ContactPerson = request.ContactPerson;
            if (request.Email != null)
                existingAddress.Email = request.Email;
            if (request.TelephoneNo != null)
                existingAddress.TelephoneNo = request.TelephoneNo;
            if (request.PortOfDestination != null)
                existingAddress.PortOfDestination = request.PortOfDestination;

            // Handle primary flag update
            if (request.IsPrimary.HasValue && request.IsPrimary.Value && !existingAddress.IsPrimary)
            {
                // Unset other primary addresses of same type
                await _customerAddressRepository.UnsetPrimaryAsync(existingAddress.CustomerId, existingAddress.AddressType, ct);
                existingAddress.IsPrimary = true;
            }
            else if (request.IsPrimary.HasValue)
            {
                existingAddress.IsPrimary = request.IsPrimary.Value;
            }

            existingAddress.UpdatedBy = userEmail;
            existingAddress.UpdatedOn = DateTime.UtcNow;

            // Update address
            await _customerAddressRepository.UpdateAsync(existingAddress, ct);
            await _unitOfWork.CommitAsync();

            return true;
        }

        /// <summary>
        /// Delete customer address by ID
        /// </summary>
        override
        public async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var exists = await _customerAddressRepository.ExistsAsync(id, ct);
            if (!exists)
                return false;

            await _customerAddressRepository.DeleteAsync(id, ct);
            await _unitOfWork.CommitAsync();

            return true;
        }

        /// <summary>
        /// Set address as primary for its type
        /// </summary>
        public async Task<bool> SetAsPrimaryAsync(long id, CancellationToken ct = default)
        {
            var address = await _customerAddressRepository.GetByIdAsync(id, ct);
            if (address == null)
                return false;

            // Unset other primary addresses of same type
            await _customerAddressRepository.UnsetPrimaryAsync(address.CustomerId, address.AddressType, ct);

            // Set as primary
            await _customerAddressRepository.SetAsPrimaryAsync(id, ct);
            await _unitOfWork.CommitAsync();

            return true;
        }

        /// <summary>
        /// Bulk create addresses for a customer
        /// </summary>
        public async Task<int> BulkCreateAsync(long customerId, IEnumerable<CreateCustomerAddressRequest> requests, string userEmail, CancellationToken ct = default)
        {
            // Validate that customer exists
            var customerExists = await _customerRepository.ExistsAsync(customerId, ct);
            if (!customerExists)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure("CustomerId", $"Customer with ID {customerId} does not exist.")
                });
            }

            var addresses = requests.Select(r =>
            {
                var address = _mapper.Map<CustomerAddress>(r);
                address.CustomerId = customerId;
                address.CreatedBy = userEmail;
                address.CreatedOn = DateTime.UtcNow;
                return address;
            });

            await _customerAddressRepository.BulkInsertAsync(addresses, ct);
            await _unitOfWork.CommitAsync();

            return addresses.Count();
        }

        /// <summary>
        /// Delete all addresses for a customer
        /// </summary>
        public async Task<int> DeleteByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            var count = await _customerAddressRepository.DeleteByCustomerIdAsync(customerId, ct);
            await _unitOfWork.CommitAsync();
            return count;
        }

        /// <summary>
        /// Count addresses for a customer
        /// </summary>
        public async Task<int> CountByCustomerIdAsync(long customerId, CancellationToken ct = default)
        {
            return await _customerAddressRepository.CountByCustomerIdAsync(customerId, ct);
        }

        /// <summary>
        /// Check if customer has primary address of specific type
        /// </summary>
        public async Task<bool> HasPrimaryAddressAsync(long customerId, string addressType, CancellationToken ct = default)
        {
            var primaryAddress = await _customerAddressRepository.GetPrimaryAddressAsync(customerId, addressType, ct);
            return primaryAddress != null;
        }

        ///// <summary>
        ///// Validate customer address data
        ///// </summary>
        //public async Task<ValidationResult> ValidateAddressAsync(CreateCustomerAddressRequest request, CancellationToken ct = default)
        //{
        //    var result = new ValidationResult { IsValid = true };

        //    // Check if customer exists
        //    var customerExists = await _customerRepository.ExistsAsync(request.CustomerId, ct);
        //    if (!customerExists)
        //    {
        //        result.IsValid = false;
        //        result.Errors.Add($"Customer with ID {request.CustomerId} does not exist.");
        //    }

        //    // Validate address type
        //    var validTypes = new[] { "legal", "delivery", "forwarder", "forwarder_agent_asia", "other" };
        //    if (!validTypes.Contains(request.AddressType))
        //    {
        //        result.IsValid = false;
        //        result.Errors.Add($"Invalid address type: {request.AddressType}. Must be one of: {string.Join(", ", validTypes)}");
        //    }

        //    // Check if setting as primary when another primary exists
        //    if (request.IsPrimary)
        //    {
        //        var existingPrimary = await _customerAddressRepository.GetPrimaryAddressAsync(request.CustomerId, request.AddressType, ct);
        //        if (existingPrimary != null)
        //        {
        //            result.Warnings.Add($"Another primary {request.AddressType} address exists. It will be replaced.");
        //        }
        //    }

        //    return result;
        //}

        //Task<Interfaces.Services.ValidationResult> ICustomerAddressService.ValidateAddressAsync(CreateCustomerAddressRequest request, CancellationToken ct)
        //{
        //    throw new NotImplementedException();
        //}
    }
}
