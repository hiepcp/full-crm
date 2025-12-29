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
using Microsoft.Extensions.Logging;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Lead service implementation with business logic
    /// </summary>
    public class LeadService : BaseService<Lead, long, CreateLeadRequest>, ILeadService
    {
        private readonly ILeadRepository _leadRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateLeadRequest> _createValidator;
        private readonly IValidator<UpdateLeadRequest> _updateValidator;
        private readonly IActivityRepository _activityRepository;
        private readonly IValidator<CreateActivityRequest> _activityCreateValidator;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ICustomerRepository _customerRepository;
        private readonly ILeadAddressRepository _leadAddressRepository;
        private readonly ICustomerAddressRepository _customerAddressRepository;
        private readonly IContactRepository _contactRepository;
        private readonly IDealRepository _dealRepository;
        private readonly IDealQuotationRepository _dealQuotationRepository;
        private readonly IValidator<CreateLeadAddressRequest> _leadAddressCreateValidator;
        private readonly ICRMDynamicsService _crmDynamicsService;
        private readonly INotificationOrchestrator _notificationOrchestrator;
        private readonly ILogger<LeadService> _logger;

        public LeadService(
            IRepository<Lead, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateLeadRequest> createValidator,
            IValidator<UpdateLeadRequest> updateValidator,
            ILeadRepository leadRepository,
            IActivityRepository activityRepository,
            IValidator<CreateActivityRequest> activityCreateValidator,
            ICustomerRepository customerRepository,
            ILeadAddressRepository leadAddressRepository,
            ICustomerAddressRepository customerAddressRepository,
            IContactRepository contactRepository,
            IDealRepository dealRepository,
            IDealQuotationRepository dealQuotationRepository,
            IValidator<CreateLeadAddressRequest> leadAddressCreateValidator,
            ICRMDynamicsService crmDynamicsService,
            INotificationOrchestrator notificationOrchestrator,
            ILogger<LeadService> logger)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _leadRepository = leadRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _activityRepository = activityRepository;
            _activityCreateValidator = activityCreateValidator;
            _unitOfWork = unitOfWork;
            _customerRepository = customerRepository;
            _leadAddressRepository = leadAddressRepository;
            _customerAddressRepository = customerAddressRepository;
            _contactRepository = contactRepository;
            _dealRepository = dealRepository;
            _dealQuotationRepository = dealQuotationRepository;
            _leadAddressCreateValidator = leadAddressCreateValidator;
            _crmDynamicsService = crmDynamicsService;
            _notificationOrchestrator = notificationOrchestrator;
            _logger = logger;
        }

        /// <summary>
        /// Query leads with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<LeadResponse>> QueryAsync(LeadQueryRequest request, CancellationToken ct = default)
        {
            var result = await _leadRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<LeadResponse>>(result.Items);

            return new PagedResult<LeadResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get lead by ID
        /// </summary>
        public async Task<LeadResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var lead = await base.GetByIdAsync(id, ct);
            if (lead == null)
                return null;

            var leadResponse = _mapper.Map<LeadResponse>(lead);

            // Load associated addresses
            var addresses = await _leadAddressRepository.GetByLeadIdAsync(id, ct);
            leadResponse.Addresses = _mapper.Map<List<CRMSys.Application.Dtos.Request.LeadAddressDto>>(addresses);

            return leadResponse;
        }

        /// <summary>
        /// Create new lead with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateLeadRequest request, string userEmail, CancellationToken ct = default)
        {
            // Additional business validation
            if (!string.IsNullOrEmpty(request.Email))
            {
                var isUnique = await _leadRepository.IsEmailUniqueAsync(request.Email, null, ct);
                if (!isUnique)
                {
                    throw new ValidationException(new[] {
                        new ValidationFailure(nameof(request.Email), "Email already exists for another lead.")
                    });
                }
            }

            // Website uniqueness check if provided
            if (!string.IsNullOrEmpty(request.Website))
            {
                var isWebsiteUnique = await _leadRepository.IsWebsiteUniqueAsync(request.Website!, null, ct);
                if (!isWebsiteUnique)
                {
                    throw new ValidationException(new[] {
                        new ValidationFailure(nameof(request.Website), "Website already exists for another lead.")
                    });
                }
            }

            // Check for duplicate based on email or phone
            var validationResult = await ValidateLeadAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors.Select(e => new ValidationFailure("", e)));
            }

            // Map to entity and create lead
            var leadEntity = _mapper.Map<Lead>(request);

            // Set audit fields
            var now = DateTime.UtcNow;
            leadEntity.CreatedOn = now;
            leadEntity.CreatedBy = userEmail;
            leadEntity.UpdatedOn = now;
            leadEntity.UpdatedBy = userEmail;

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var leadId = await _leadRepository.CreateAsync(leadEntity, ct);

                // Handle addresses if provided
                if (request.Addresses != null && request.Addresses.Any())
                {
                    var addressEntities = _mapper.Map<IEnumerable<LeadAddress>>(request.Addresses);
                    foreach (var address in addressEntities)
                    {
                        address.LeadId = leadId;
                        address.CreatedOn = now;
                        address.CreatedBy = userEmail;
                        address.UpdatedOn = now;
                        address.UpdatedBy = userEmail;
                    }
                    await _leadAddressRepository.BulkInsertAsync(addressEntities, ct);
                }

                await _unitOfWork.CommitAsync();

                // Send notifications after successful creation (outside transaction)
                try
                {
                    await _notificationOrchestrator.NotifyEntityChangeAsync(
                        entityType: "lead",
                        entityId: leadId,
                        context: new CRMSys.Application.Dtos.Notification.NotificationContext
                        {
                            EventType = "CREATED"
                        },
                        entityData: new
                        {
                            //Name = request.CompanyName ?? request.Email,
                            Email = request.Email,
                            Status = request.Status
                        });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send notifications for Lead {LeadId} creation", leadId);
                }

                return leadId;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                throw new ValidationException(new[] {
                        new ValidationFailure(nameof(request.Email), ex.Message)
                    });
            }
        }

        /// <summary>
        /// Create new public lead 
        /// </summary>
        public async Task<long> CreateDraftAsync(CreateLeadRequest request, string userEmail, CancellationToken ct = default)
        {
            // Additional business validation
            if (!string.IsNullOrEmpty(request.Email))
            {
                var isUnique = await _leadRepository.IsEmailUniqueAsync(request.Email, null, ct);
                if (!isUnique)
                {
                    return 0;
                }
            }

            // Check for duplicate based on email or phone
            var validationResult = await ValidateLeadAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors.Select(e => new ValidationFailure("", e)));
            }

            // Map to entity and create lead
            var leadEntity = _mapper.Map<Lead>(request);

            // Set audit fields
            var now = DateTime.UtcNow;
            leadEntity.CreatedOn = now;
            leadEntity.CreatedBy = userEmail;
            leadEntity.UpdatedOn = now;
            leadEntity.UpdatedBy = userEmail;

            try
            {
                await _unitOfWork.BeginTransactionAsync();

                var leadId = await _leadRepository.CreateAsync(leadEntity, ct);

                // Handle addresses if provided
                if (request.Addresses != null && request.Addresses.Any())
                {
                    var addressEntities = _mapper.Map<IEnumerable<LeadAddress>>(request.Addresses);
                    foreach (var address in addressEntities)
                    {
                        address.LeadId = leadId;
                        address.CreatedOn = now;
                        address.CreatedBy = userEmail;
                        address.UpdatedOn = now;
                        address.UpdatedBy = userEmail;
                    }
                    await _leadAddressRepository.BulkInsertAsync(addressEntities, ct);
                }

                await _unitOfWork.CommitAsync();

                // Send notifications after successful creation (outside transaction)
                try
                {
                    await _notificationOrchestrator.NotifyEntityChangeAsync(
                        entityType: "lead",
                        entityId: leadId,
                        context: new CRMSys.Application.Dtos.Notification.NotificationContext
                        {
                            EventType = "CREATED"
                        },
                        entityData: new
                        {
                            //Name = request.CompanyName ?? request.Email,
                            Email = request.Email,
                            Status = request.Status
                        });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send notifications for Lead {LeadId} creation", leadId);
                }

                return leadId;
            }
            catch (Exception ex)
            {
                await _unitOfWork.RollbackAsync();
                throw new ValidationException(new[] {
                        new ValidationFailure(nameof(request.Email), ex.Message)
                    });
            }
        }

        /// <summary>
        /// Update existing lead
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateLeadRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Check email uniqueness if email is being updated
            if (!string.IsNullOrEmpty(request.Email))
            {
                var isUnique = await _leadRepository.IsEmailUniqueAsync(request.Email, id);
                if (!isUnique)
                {
                    throw new ValidationException(new[] {
                        new ValidationFailure(nameof(request.Email), "Email already exists for another lead.")
                    });
                }
            }

            // Check website uniqueness if website is being updated
            if (!string.IsNullOrEmpty(request.Website))
            {
                var isWebsiteUnique = await _leadRepository.IsWebsiteUniqueAsync(request.Website!, id, ct);
                if (!isWebsiteUnique)
                {
                    throw new ValidationException(new[] {
                        new ValidationFailure(nameof(request.Website), "Website already exists for another lead.")
                    });
                }
            }

            // Start transaction for the entire operation
            await _unitOfWork.BeginTransactionAsync();

            try
            {
                // Get existing lead
                var existingLead = await base.GetByIdAsync(id, ct);
                if (existingLead == null)
                    throw new KeyNotFoundException($"Lead with id {id} not found.");

                // Map update request to existing entity
                _mapper.Map(request, existingLead);

                // Set audit fields
                existingLead.UpdatedOn = DateTime.UtcNow;
                existingLead.UpdatedBy = userEmail;

                // Update the lead entity
                await _leadRepository.UpdateAsync(existingLead, ct);

                // Handle addresses update if provided
                if (request.Addresses != null && request.Addresses.Any())
                {
                    // Get existing addresses for this lead
                    var existingAddresses = await _leadAddressRepository.GetByLeadIdAsync(id, ct);
                    var existingAddressIds = existingAddresses.Select(a => a.Id).ToHashSet();

                    // Process each address in the request
                    var addressesToUpdate = new List<LeadAddress>();
                    var addressesToCreate = new List<LeadAddress>();
                    var addressIdsToKeep = new HashSet<long>();

                    foreach (var addressDto in request.Addresses)
                    {
                        var address = _mapper.Map<LeadAddress>(addressDto);
                        address.LeadId = id;
                        address.UpdatedOn = DateTime.UtcNow;
                        address.UpdatedBy = userEmail;

                        if (addressDto.Id.HasValue && addressDto.Id.Value > 0)
                        {
                            // Existing address - update
                            address.Id = addressDto.Id.Value;
                            addressesToUpdate.Add(address);
                            addressIdsToKeep.Add(address.Id);
                        }
                        else
                        {
                            // New address - create
                            address.CreatedOn = DateTime.UtcNow;
                            address.CreatedBy = userEmail;
                            addressesToCreate.Add(address);
                        }
                    }

                    // Bulk update existing addresses
                    if (addressesToUpdate.Any())
                    {
                        await _leadAddressRepository.BulkUpdateAsync(addressesToUpdate, ct);
                    }

                    // Bulk create new addresses
                    if (addressesToCreate.Any())
                    {
                        await _leadAddressRepository.BulkInsertAsync(addressesToCreate, ct);
                    }

                    // Delete addresses that are no longer in the request
                    var addressIdsToDelete = existingAddressIds.Except(addressIdsToKeep).ToList();
                    if (addressIdsToDelete.Any())
                    {
                        await _leadAddressRepository.DeleteByIdsAsync(addressIdsToDelete, ct);
                    }
                }

                await _unitOfWork.CommitAsync();

                // Send notifications after successful update (outside transaction)
                try
                {
                    await _notificationOrchestrator.NotifyEntityChangeAsync(
                        entityType: "lead",
                        entityId: id,
                        context: new CRMSys.Application.Dtos.Notification.NotificationContext
                        {
                            EventType = "UPDATED"
                        },
                        entityData: new
                        {
                            //Name = existingLead.CompanyName ?? existingLead.Email,
                            Email = existingLead.Email,
                            Status = existingLead.Status
                        });
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Failed to send notifications for Lead {LeadId} update", id);
                }
            }
            catch (Exception)
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }

            return true;
        }

        /// <summary>
        /// Delete lead by ID
        /// </summary>
        override
        public async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var lead = await GetByIdAsync(id);
            if (lead == null)
                return false;

            // Business rule: Don't delete converted leads
            if (lead.IsConverted)
            {
                throw new InvalidOperationException("Cannot delete a converted lead. Convert back first.");
            }

            await base.DeleteAsync(id, userEmail);
            return true;
        }

        /// <summary>
        /// Convert lead to customer/contact
        /// </summary>
        public async Task<bool> ConvertLeadAsync(long leadId, long customerId, long? contactId = null, CancellationToken ct = default)
        {
            var canConvert = await CanConvertLeadAsync(leadId, ct);
            if (!canConvert)
            {
                throw new InvalidOperationException("Lead cannot be converted. Check business rules.");
            }

            return await _leadRepository.ConvertLeadAsync(leadId, customerId, contactId, ct);
        }

        /// <summary>
        /// Create a new address for a lead
        /// </summary>
        public async Task<long> CreateLeadAddressAsync(CreateLeadAddressRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate input
            var validationResult = await _leadAddressCreateValidator.ValidateAsync(request, ct);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            if (!request.RelationType.Equals("lead", StringComparison.OrdinalIgnoreCase))
            {
                throw new ValidationException(new[]
                {
                    new ValidationFailure(nameof(request.RelationType), "RelationType must be 'lead'.")
                });
            }

            // Ensure lead exists
            var leadExists = await _leadRepository.GetByIdAsync(request.RelationId, ct);
            if (leadExists == null)
            {
                throw new ValidationException(new[]
                {
                    new ValidationFailure(nameof(request.RelationId), $"Lead with ID {request.RelationId} does not exist.")
                });
            }

            var address = _mapper.Map<LeadAddress>(request);
            address.LeadId = request.RelationId;

            var now = DateTime.UtcNow;
            address.CreatedOn = now;
            address.CreatedBy = userEmail;
            address.UpdatedOn = now;
            address.UpdatedBy = userEmail;

            var id = await _leadAddressRepository.CreateAsync(address, ct);
            await _unitOfWork.CommitAsync();

            return id;
        }

        /// <summary>
        /// Mark lead as duplicate
        /// </summary>
        public async Task<bool> MarkAsDuplicateAsync(long leadId, long duplicateOfLeadId, CancellationToken ct = default)
        {
            if (leadId == duplicateOfLeadId)
            {
                throw new ArgumentException("Lead cannot be duplicate of itself.");
            }

            // Check if both leads exist
            var lead = await GetByIdAsync(leadId);
            var duplicateOf = await GetByIdAsync(duplicateOfLeadId);

            if (lead == null || duplicateOf == null)
            {
                throw new KeyNotFoundException("One or both leads not found.");
            }

            // Business rule: Don't mark converted leads as duplicates
            if (lead.IsConverted || duplicateOf.IsConverted)
            {
                throw new InvalidOperationException("Cannot mark converted leads as duplicates.");
            }

            return await _leadRepository.MarkAsDuplicateAsync(leadId, duplicateOfLeadId, ct);
        }

        /// <summary>
        /// Bulk update lead status
        /// </summary>
        public async Task<int> BulkUpdateStatusAsync(IEnumerable<long> leadIds, string newStatus, CancellationToken ct = default)
        {
            // Validate status
            var validStatuses = new[] { "working", "qualified", "unqualified" };
            if (!validStatuses.Contains(newStatus))
            {
                throw new ArgumentException($"Invalid status: {newStatus}");
            }

            return await _leadRepository.BulkUpdateStatusAsync(leadIds, newStatus, ct);
        }

        /// <summary>
        /// Bulk assign leads to owner
        /// </summary>
        public async Task<int> BulkAssignAsync(IEnumerable<long> leadIds, long ownerId, CancellationToken ct = default)
        {
            // Validate owner exists (would need user service)
            // For now, just check if ownerId is valid
            if (ownerId <= 0)
            {
                throw new ArgumentException("Invalid owner ID.");
            }

            return await _leadRepository.BulkAssignAsync(leadIds, ownerId, ct);
        }

        /// <summary>
        /// Get leads by owner ID
        /// </summary>
        public async Task<IEnumerable<LeadResponse>> GetByOwnerIdAsync(long ownerId, CancellationToken ct = default)
        {
            var leads = await _leadRepository.GetByOwnerIdAsync(ownerId, ct);
            return _mapper.Map<IEnumerable<LeadResponse>>(leads);
        }

        /// <summary>
        /// Get leads by status
        /// </summary>
        public async Task<IEnumerable<LeadResponse>> GetByStatusAsync(string status, CancellationToken ct = default)
        {
            var leads = await _leadRepository.GetByStatusAsync(status, ct);
            return _mapper.Map<IEnumerable<LeadResponse>>(leads);
        }

        /// <summary>
        /// Get qualified leads
        /// </summary>
        public async Task<IEnumerable<LeadResponse>> GetQualifiedLeadsAsync(int minScore = 70, CancellationToken ct = default)
        {
            var leads = await _leadRepository.GetQualifiedLeadsAsync(minScore, ct);
            return _mapper.Map<IEnumerable<LeadResponse>>(leads);
        }

        /// <summary>
        /// Get lead statistics
        /// </summary>
        public async Task<LeadStatistics> GetStatisticsAsync(CancellationToken ct = default)
        {
            // This would typically use a more complex query or stored procedure
            // For now, return a basic implementation
            var allLeads = await base.GetAllAsync(ct);

            return new LeadStatistics
            {
                TotalLeads = allLeads.Count(),
                QualifiedLeads = allLeads.Count(l => l.IsQualified),
                ConvertedLeads = allLeads.Count(l => l.IsConverted),
                UnqualifiedLeads = allLeads.Count(l => l.IsUnqualified),
                LeadsBySource = allLeads
                    .Where(l => !string.IsNullOrEmpty(l.Source))
                    .GroupBy(l => l.Source!)
                    .ToDictionary(g => g.Key, g => g.Count()),
                LeadsByStatus = allLeads
                    .Where(l => !string.IsNullOrEmpty(l.Status))
                    .GroupBy(l => l.Status!)
                    .ToDictionary(g => g.Key, g => g.Count()),
                AverageScore = allLeads.Where(l => l.Score.HasValue).Average(l => l.Score!.Value),
                GeneratedAt = DateTime.UtcNow
            };
        }

        /// <summary>
        /// Validate lead data
        /// </summary>
        public async Task<CRMSys.Application.Interfaces.Services.ValidationResult> ValidateLeadAsync(CreateLeadRequest request, CancellationToken ct = default)
        {
            var result = new CRMSys.Application.Interfaces.Services.ValidationResult
            {
                IsValid = true,
                Errors = new List<string>(),
                Warnings = new List<string>(),
                Metadata = new Dictionary<string, object>()
            };

            // Check for potential duplicates
            if (!string.IsNullOrEmpty(request.Email))
            {
                var existingByEmail = await _leadRepository.IsEmailUniqueAsync(request.Email, null, ct);
                if (!existingByEmail)
                {
                    result.Warnings.Add("A lead with this email already exists.");
                }
            }

            // Business rules validation
            if (request.Score.HasValue && request.Score.Value > 90)
            {
                result.Metadata["highValueLead"] = true;
            }

            if (!request.HasBasicInfo)
            {
                result.Warnings.Add("Lead has no email or phone - consider adding contact information.");
            }

            return result;
        }

        /// <summary>
        /// Check if lead can be converted
        /// </summary>
        public async Task<bool> CanConvertLeadAsync(long leadId, CancellationToken ct = default)
        {
            var lead = await GetByIdAsync(leadId, ct);
            if (lead == null) return false;

            // Business rules for conversion
            return lead.IsQualified && !lead.IsDuplicate && !lead.IsConverted;
        }

        /// <summary>
        /// Convert a qualified lead into a new customer and copy its addresses.
        /// </summary>
        public async Task<long> ConvertLeadToNewCustomerAsync(long leadId, CancellationToken ct = default)
        {
            var lead = await base.GetByIdAsync(leadId, ct);
            if (lead == null)
                throw new KeyNotFoundException($"Lead {leadId} not found.");

            // Check each conversion rule and provide specific error messages
            if (lead.IsConverted)
                throw new InvalidOperationException("Lead has already been converted to a customer.");

            if (!lead.IsQualified)
                throw new InvalidOperationException("Lead cannot be converted. Lead score must be at least 70 to be considered qualified.");

            if (lead.IsDuplicate)
                throw new InvalidOperationException("Lead cannot be converted. This lead is marked as a duplicate.");

            var now = DateTime.UtcNow;

            // 1. Create customer from lead core info (legal information)
            var customer = new Customer
            {
                Name = !string.IsNullOrWhiteSpace(lead.Company) ? lead.Company! : lead.DisplayName,
                Domain = lead.Website,
                Phone = lead.TelephoneNo,
                Email = lead.Email,
                Website = lead.Website,
                VatNumber = lead.VatNumber,
                Country = lead.Country,
                PaymentTerms = lead.PaymentTerms,
                Type = "Customer",
                CreatedOn = now,
                UpdatedOn = now,
                CreatedBy = lead.CreatedBy,
                UpdatedBy = lead.UpdatedBy
            };

            var customerId = await _customerRepository.CreateAsync(customer, ct);

            // 2. Copy lead addresses to customer addresses
            var leadAddresses = await _leadAddressRepository.GetByLeadIdAsync(leadId, ct);
            var customerAddresses = leadAddresses.Select(a => new CustomerAddress
            {
                CustomerId = customerId,
                AddressType = a.AddressType,
                CompanyName = a.CompanyName,
                AddressLine = a.AddressLine,
                Postcode = a.Postcode,
                City = a.City,
                Country = a.Country,
                ContactPerson = a.ContactPerson,
                Email = a.Email,
                TelephoneNo = a.TelephoneNo,
                PortOfDestination = a.PortOfDestination,
                IsPrimary = a.IsPrimary,
                CreatedOn = now,
                UpdatedOn = now,
                CreatedBy = lead.CreatedBy,
                UpdatedBy = lead.UpdatedBy
            }).ToList();

            if (customerAddresses.Any())
            {
                await _customerAddressRepository.BulkInsertAsync(customerAddresses, ct);
            }

            // 3. Mark lead as converted and link customer
            await _leadRepository.ConvertLeadAsync(leadId, customerId, lead.ContactId, ct);

            await _unitOfWork.CommitAsync();

            return customerId;
        }

        /// <summary>
        /// Orchestrated creation of Lead and its initial Activity within one transaction.
        /// </summary>
        public async Task<(long LeadId, long ActivityId)> CreateWithActivityAsync(CreateLeadWithActivityRequest request, string userEmail, CancellationToken ct = default)
        {
            if (request == null) throw new ArgumentNullException(nameof(request));
            if (request.Activity == null) throw new ValidationException("Initial activity is required.");

            // Validate lead
            var leadValidation = await _createValidator.ValidateAsync(request.Lead, ct);
            if (!leadValidation.IsValid)
                throw new ValidationException(leadValidation.Errors);

            // Enforce email uniqueness
            if (!string.IsNullOrEmpty(request.Lead.Email))
            {
                var isUnique = await _leadRepository.IsEmailUniqueAsync(request.Lead.Email!, null, ct);
                if (!isUnique)
                    throw new ValidationException(new[] { new ValidationFailure(nameof(request.Lead.Email), "Email already exists for another lead.") });
            }

            // Enforce website uniqueness if provided
            if (!string.IsNullOrEmpty(request.Lead.Website))
            {
                var isWebsiteUnique = await _leadRepository.IsWebsiteUniqueAsync(request.Lead.Website!, null, ct);
                if (!isWebsiteUnique)
                    throw new ValidationException(new[] { new ValidationFailure(nameof(request.Lead.Website), "Website already exists for another lead.") });
            }

            // Validate activity
            var activityValidation = await _activityCreateValidator.ValidateAsync(request.Activity, ct);
            if (!activityValidation.IsValid)
                throw new ValidationException(activityValidation.Errors);

            // Map to entities
            var leadEntity = _mapper.Map<Lead>(request.Lead);
            var activityEntity = _mapper.Map<Activity>(request.Activity);

            // Set audit fields
            var now = DateTime.UtcNow;
            leadEntity.CreatedOn = now; leadEntity.CreatedBy = userEmail; leadEntity.UpdatedOn = now; leadEntity.UpdatedBy = userEmail;
            activityEntity.CreatedOn = now; activityEntity.CreatedBy = userEmail; activityEntity.UpdatedOn = now; activityEntity.UpdatedBy = userEmail;

            // Start transaction for the entire operation
            await _unitOfWork.BeginTransactionAsync();

            // Persist both within the same unit of work
            var leadId = await _leadRepository.CreateAsync(leadEntity, ct);

            // Handle addresses if provided
            if (request.Lead.Addresses != null && request.Lead.Addresses.Any())
            {
                var addressEntities = _mapper.Map<IEnumerable<LeadAddress>>(request.Lead.Addresses);
                foreach (var address in addressEntities)
                {
                    address.LeadId = leadId;
                    address.CreatedOn = now;
                    address.CreatedBy = userEmail;
                    address.UpdatedOn = now;
                    address.UpdatedBy = userEmail;
                }
                await _leadAddressRepository.BulkInsertAsync(addressEntities, ct);
            }

            // Ensure relation is set
            activityEntity.RelationType = "lead";
            activityEntity.RelationId = leadId;

            var activityId = await _activityRepository.CreateAsync(activityEntity, ct);

            await _unitOfWork.CommitAsync();

            return (leadId, activityId);
        }

        /// <summary>
        /// Convert lead to deal with customer and contact creation
        /// </summary>
        public async Task<long> ConvertLeadToDealAsync(long leadId, ConvertLeadToDealRequest request, CancellationToken ct = default)
        {
            await _unitOfWork.BeginTransactionAsync();

            var lead = await base.GetByIdAsync(leadId, ct);
            if (lead == null)
                throw new KeyNotFoundException($"Lead {leadId} not found.");

            // Check each conversion rule and provide specific error messages
            if (lead.IsConverted)
                throw new InvalidOperationException("Lead has already been converted to a customer.");

            if (!lead.IsQualified)
                throw new InvalidOperationException("Lead cannot be converted. Lead score must be at least 70 to be considered qualified.");

            if (lead.IsDuplicate)
                throw new InvalidOperationException("Lead cannot be converted. This lead is marked as a duplicate.");

            var now = DateTime.UtcNow;

            // Step 1: Create prospect in Dynamics and use returned CustAccount as customerId
            var prospectName = !string.IsNullOrWhiteSpace(lead.Company)
                ? lead.Company!
                : (!string.IsNullOrWhiteSpace(lead.DisplayName) ? lead.DisplayName : $"{lead.FirstName} {lead.LastName}".Trim());

            var customerId = await _crmDynamicsService.ImportProspectAsync(
                prospectName,
                string.IsNullOrWhiteSpace(lead.CreatedBy) ? "000051" : lead.CreatedBy,
                string.IsNullOrWhiteSpace(lead.Country) ? "VNM" : lead.Country!,
                lead.TelephoneNo ?? string.Empty,
                lead.Email ?? string.Empty,
                ct);

            // Step 1b: Ensure local CRM customer exists with the Dynamics CustAccount Id
            var customer = new Customer
            {
                Id = customerId,
                Name = prospectName,
                Domain = lead.Website,
                Phone = lead.TelephoneNo,
                Email = lead.Email,
                Website = lead.Website,
                VatNumber = lead.VatNumber,
                Country = lead.Country,
                PaymentTerms = lead.PaymentTerms,
                Type = "Customer",
                OwnerId = lead.OwnerId,
                CreatedOn = now,
                UpdatedOn = now,
                CreatedBy = lead.CreatedBy,
                UpdatedBy = lead.UpdatedBy
            };

            await _customerRepository.CreateWithExplicitIdAsync(customer, ct);

            // Step 2: Create contact if requested
            long? contactId = null;
            if (request.CreateContact)
            {
                var contact = new Contact
                {
                    CustomerId = customerId,
                    FirstName = lead.FirstName,
                    LastName = lead.LastName,
                    Email = lead.Email,
                    Phone = lead.TelephoneNo,
                    JobTitle = "Contact from Lead",
                    CreatedOn = now,
                    UpdatedOn = now,
                    CreatedBy = lead.CreatedBy,
                    UpdatedBy = lead.UpdatedBy
                };

                contactId = await _contactRepository.CreateAsync(contact, ct);
            }

            // Step 3: Create deal
            var deal = new Deal
            {
                CustomerId = customerId,
                OwnerId = lead.OwnerId,
                LeadId = leadId,
                Name = request.Name,
                Description = request.Description,
                Stage = request.Stage,
                ExpectedRevenue = request.ExpectedRevenue,
                CloseDate = request.CloseDate,
                ContactId = contactId,
                Note = request.Note,
                CreatedOn = now,
                UpdatedOn = now,
                CreatedBy = lead.CreatedBy,
                UpdatedBy = lead.UpdatedBy
            };

            var dealId = await _dealRepository.CreateAsync(deal, ct);

            // Step 4: Copy lead addresses to customer addresses
            var leadAddresses = await _leadAddressRepository.GetByLeadIdAsync(leadId, ct);
            if (leadAddresses.Any())
            {
                var customerAddresses = leadAddresses.Select(a => new CustomerAddress
                {
                    CustomerId = customerId,
                    AddressType = a.AddressType,
                    CompanyName = a.CompanyName,
                    AddressLine = a.AddressLine,
                    Postcode = a.Postcode,
                    City = a.City,
                    Country = a.Country,
                    ContactPerson = a.ContactPerson,
                    Email = a.Email,
                    TelephoneNo = a.TelephoneNo,
                    PortOfDestination = a.PortOfDestination,
                    IsPrimary = a.IsPrimary,
                    CreatedOn = now,
                    UpdatedOn = now,
                    CreatedBy = lead.CreatedBy,
                    UpdatedBy = lead.UpdatedBy
                }).ToList();

                await _customerAddressRepository.BulkInsertAsync(customerAddresses, ct);
            }

            // Step 5: Link quotations to deal if any selected
            if (request.HasSelectedQuotations)
            {
                var dealQuotations = request.SelectedQuotationNumbers!.Select(qNumber => new DealQuotation
                {
                    DealId = dealId,
                    QuotationNumber = qNumber,
                    CreatedOn = now,
                    CreatedBy = lead.CreatedBy
                }).ToList();

                await _dealQuotationRepository.BulkInsertAsync(dealQuotations, ct);
            }

            // Step 6: Update lead status to qualified and link customer/contact/deal
            lead.Status = "qualified";
            lead.IsConverted = true;
            lead.ConvertedAt = now;
            lead.CustomerId = customerId;
            lead.ContactId = contactId;
            lead.DealId = dealId;
            lead.UpdatedOn = now;
            lead.UpdatedBy = lead.UpdatedBy;

            await _leadRepository.UpdateAsync(lead, ct);

            await _unitOfWork.CommitAsync();

            return dealId;
        }

        /// <summary>
        /// Find existing customer by email or company name
        /// </summary>
        private async Task<Customer?> FindExistingCustomerAsync(Lead lead, CancellationToken ct = default)
        {
            // Try to find by email first
            if (!string.IsNullOrEmpty(lead.Email))
            {
                var customersByEmail = await _customerRepository.GetByEmailAsync(lead.Email, ct);
                if (customersByEmail.Any())
                    return customersByEmail.First();
            }

            // Try to find by company name
            if (!string.IsNullOrEmpty(lead.Company))
            {
                var customersByName = await _customerRepository.GetByNameAsync(lead.Company, ct);
                if (customersByName.Any())
                    return customersByName.First();
            }

            // Try to find by domain/website
            if (!string.IsNullOrEmpty(lead.Website))
            {
                var customersByDomain = await _customerRepository.GetByDomainAsync(lead.Website, ct);
                if (customersByDomain.Any())
                    return customersByDomain.First();
            }

            return null;
        }
    }
}

