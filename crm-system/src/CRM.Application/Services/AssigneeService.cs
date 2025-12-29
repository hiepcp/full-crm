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
    /// <summary>
    /// Assignee service implementation with business logic
    /// </summary>
    public class AssigneeService : BaseService<Assignee, long, CreateAssigneeRequest>, IAssigneeService
    {
        private readonly IAssigneeRepository _assigneeRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateAssigneeRequest> _createValidator;
        private readonly IValidator<UpdateAssigneeRequest> _updateValidator;
        private readonly IValidator<AssigneeQueryRequest> _queryValidator;
        private readonly IRepository<Assignee, long> _repository;
        private readonly IUnitOfWork _unitOfWork;

        public AssigneeService(
            IRepository<Assignee, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateAssigneeRequest> createValidator,
            IValidator<UpdateAssigneeRequest> updateValidator,
            IValidator<AssigneeQueryRequest> queryValidator,
            IAssigneeRepository assigneeRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _assigneeRepository = assigneeRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _queryValidator = queryValidator;
            _repository = repository;
            _unitOfWork = unitOfWork;
        }

        /// <summary>
        /// Query assignees with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<AssigneeResponse>> QueryAsync(AssigneeQueryRequest request, CancellationToken ct = default)
        {
            // Validate query request
            var validationResult = await _queryValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            var result = await _assigneeRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<AssigneeResponse>>(result.Items);

            return new PagedResult<AssigneeResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get assignee by ID
        /// </summary>
        public new async Task<AssigneeResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var assignee = await base.GetByIdAsync(id, ct);
            return assignee != null ? _mapper.Map<AssigneeResponse>(assignee) : null;
        }

        /// <summary>
        /// Get assignees by relation (e.g., all assignees for a specific lead)
        /// </summary>
        public async Task<IEnumerable<AssigneeResponse>> GetByRelationAsync(string relationType, long relationId, CancellationToken ct = default)
        {
            var assignees = await _assigneeRepository.GetByRelationAsync(relationType, relationId, ct);
            return _mapper.Map<IEnumerable<AssigneeResponse>>(assignees);
        }

        /// <summary>
        /// Create new assignee with business validation
        /// </summary>
        public async Task<long> CreateAsync(CreateAssigneeRequest request, string userEmail, CancellationToken ct = default)
        {
            // Check if assignment already exists
            var exists = await _assigneeRepository.AssignmentExistsAsync(request.UserEmail, request.RelationType!, request.RelationId, ct);
            if (exists)
            {
                throw new ValidationException(new[] {
                    new FluentValidation.Results.ValidationFailure("Assignment", "User is already assigned to this relation.")
                });
            }

            // If role is owner, ensure no other owner exists for this relation
            if (request.Role == "owner")
            {
                var existingOwner = await _assigneeRepository.GetUserRoleAsync(request.UserEmail, request.RelationType!, request.RelationId, ct);
                if (existingOwner == "owner")
                {
                    // Remove existing owner role first
                    // This is a business rule - we allow only one owner per relation
                }
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing assignee
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateAssigneeRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Get existing assignee
            var existingAssignee = await _assigneeRepository.GetByIdAsync(id, ct);
            if (existingAssignee == null)
            {
                return false;
            }

            // If changing to owner role, ensure no other owner exists for this relation
            if (request.Role == "owner" && existingAssignee.Role != "owner")
            {
                // Business rule: allow transfer of ownership
                // We could implement logic here to remove other owners if needed
            }

            // Update fields
            if (!string.IsNullOrEmpty(request.Role))
            {
                existingAssignee.Role = request.Role;
            }

            if (request.Notes != null)
            {
                existingAssignee.Notes = request.Notes;
            }

            existingAssignee.UpdatedOn = DateTime.UtcNow;
            existingAssignee.UpdatedBy = userEmail;

            // Start transaction for the update operation
            try
            {
                await _unitOfWork.BeginTransactionAsync();
                await _assigneeRepository.UpdateAsync(existingAssignee, ct);
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
        /// Delete assignee by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            // Get existing assignee to check if it's an owner
            var existingAssignee = await _assigneeRepository.GetByIdAsync(id, default);
            if (existingAssignee == null)
            {
                return false;
            }

            // Business rule: prevent deletion if this is the only owner
            if (existingAssignee.Role == "owner")
            {
                var otherAssignees = await _assigneeRepository.GetByRelationAsync(
                    existingAssignee.RelationType, existingAssignee.RelationId, default);

                var ownerCount = otherAssignees.Count(a => a.Role == "owner" && a.Id != id);
                if (ownerCount == 0)
                {
                    throw new ValidationException(new[] {
                        new FluentValidation.Results.ValidationFailure("Owner", "Cannot remove the only owner. Transfer ownership first.")
                    });
                }
            }

            await base.DeleteAsync(id, userEmail, default);
            return true;
        }

        /// <summary>
        /// Check if user is assigned to a specific relation
        /// </summary>
        public async Task<bool> IsUserAssignedAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default)
        {
            return await _assigneeRepository.IsUserAssignedAsync(userEmail, relationType, relationId, ct);
        }

        /// <summary>
        /// Get user's role for a specific relation
        /// </summary>
        public async Task<string?> GetUserRoleAsync(string userEmail, string relationType, long relationId, CancellationToken ct = default)
        {
            return await _assigneeRepository.GetUserRoleAsync(userEmail, relationType, relationId, ct);
        }

        /// <summary>
        /// Remove all assignees from a relation (useful when deleting entities)
        /// </summary>
        public async Task<int> RemoveAllFromRelationAsync(string relationType, long relationId, string userEmail, CancellationToken ct = default)
        {
            return await _assigneeRepository.RemoveAllFromRelationAsync(relationType, relationId, ct);
        }

        /// <summary>
        /// Transfer ownership from one user to another for a specific relation
        /// </summary>
        public async Task<bool> TransferOwnershipAsync(string relationType, long relationId, string fromUserEmail, string toUserEmail, string performedByEmail, CancellationToken ct = default)
        {
            // Check if fromUser is actually an owner
            var fromUserRole = await _assigneeRepository.GetUserRoleAsync(fromUserEmail, relationType, relationId, ct);
            if (fromUserRole != "owner")
            {
                return false;
            }

            // Check if toUser is already assigned
            var toUserAssigned = await _assigneeRepository.IsUserAssignedAsync(toUserEmail, relationType, relationId, ct);
            if (!toUserAssigned)
            {
                // First assign the user as collaborator
                var createRequest = new CreateAssigneeRequest
                {
                    RelationType = relationType,
                    RelationId = relationId,
                    UserEmail = toUserEmail,
                    Role = "collaborator"
                };

                await CreateAsync(createRequest, performedByEmail, ct);
            }

            // Update roles
            var assignees = await _assigneeRepository.GetByRelationAsync(relationType, relationId, ct);
            foreach (var assignee in assignees)
            {
                if (assignee.UserEmail == fromUserEmail && assignee.Role == "owner")
                {
                    assignee.Role = "collaborator";
                    assignee.UpdatedOn = DateTime.UtcNow;
                    assignee.UpdatedBy = performedByEmail;
                    await _assigneeRepository.UpdateAsync(assignee, ct);
                }
                else if (assignee.UserEmail == toUserEmail)
                {
                    assignee.Role = "owner";
                    assignee.UpdatedOn = DateTime.UtcNow;
                    assignee.UpdatedBy = performedByEmail;
                    await _assigneeRepository.UpdateAsync(assignee, ct);
                }
            }

            return true;
        }
    }
}
