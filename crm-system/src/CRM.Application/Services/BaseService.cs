using AutoMapper;
using CRMSys.Application.Interfaces.Services;
using FluentValidation;
using Serilog;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using System.Data;
using static Dapper.SqlMapper;

namespace CRMSys.Application.Services
{
    public class BaseService<TEntity, TKey, TRequestDto> : IBaseService<TEntity, TKey, TRequestDto>
        where TEntity : class, new()
    {
        private readonly IRepository<TEntity, TKey> _repository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IValidator<TRequestDto> _validator;
        private readonly string _entityName;

        public BaseService(
            IRepository<TEntity, TKey> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<TRequestDto> validator)
        {
            _repository = repository ?? throw new ArgumentNullException(nameof(repository));
            _unitOfWork = unitOfWork ?? throw new ArgumentNullException(nameof(unitOfWork));
            _mapper = mapper ?? throw new ArgumentNullException(nameof(mapper));
            _validator = validator ?? throw new ArgumentNullException(nameof(validator));
            _entityName = typeof(TEntity).Name;
        }

        // ====================================================================
        // READ OPERATIONS (No Transaction Required)
        // ====================================================================

        public virtual async Task<IEnumerable<TEntity>?> GetAllAsync(CancellationToken ct = default)
        {
            try
            {
                Log.Debug("GetAllAsync - Retrieving all {EntityName}", _entityName);
                var entities = await _repository.GetAllAsync(ct);
                Log.Debug("GetAllAsync - Retrieved {Count} {EntityName} records", entities?.Count() ?? 0, _entityName);
                if (entities == null)
                    return null;
                return entities;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetAllAsync - Failed to retrieve {EntityName}", _entityName);
                throw;
            }
        }

        public virtual async Task<TEntity?> GetByIdAsync(TKey id, CancellationToken ct = default)
        {
            try
            {
                Log.Debug("GetByIdAsync - Retrieving {EntityName} with Id={Id}", _entityName, id);

                var entity = await _repository.GetByIdAsync(id, ct);

                if (entity == null)
                {
                    Log.Warning("GetByIdAsync - {EntityName} with Id={Id} not found", _entityName, id);
                    throw new KeyNotFoundException($"{_entityName} with id {id} not found.");
                }

                Log.Debug("GetByIdAsync - {EntityName} with Id={Id} retrieved successfully", _entityName, id);
                return entity;
            }
            catch (KeyNotFoundException)
            {
                throw; // Re-throw business exceptions
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetByIdAsync - Failed to retrieve {EntityName} with Id={Id}", _entityName, id);
                throw;
            }
        }

        public virtual async Task<PagedResult<TEntity>> GetPagedAsync(PagedRequest request, CancellationToken ct = default)
        {
            try
            {
                ArgumentNullException.ThrowIfNull(request);

                Log.Information("GetPagedAsync - {EntityName} Page={Page}, PageSize={PageSize}", _entityName, request.Page, request.PageSize);

                var result = await _repository.GetPagedAsync(request, ct);

                Log.Information("GetPagedAsync - Retrieved {ItemCount} of {TotalCount} {EntityName} records", result.Items?.Count() ?? 0, result.TotalCount, _entityName);

                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetPagedAsync - Failed for {EntityName}", _entityName);
                throw;
            }
        }

        // ====================================================================
        // WRITE OPERATIONS (Transaction Required)
        // ====================================================================

        public virtual async Task<TKey> AddAsync(
            TRequestDto dto,
            string userEmail,
            CancellationToken ct = default)
        {
            ArgumentNullException.ThrowIfNull(dto);
            ArgumentException.ThrowIfNullOrWhiteSpace(userEmail);
            TEntity? entity = null;
            try
            {
                Log.Information("AddAsync - Creating new {EntityName} by {User}", _entityName, userEmail);
                // Validate DTO
                var validationResult = await _validator.ValidateAsync(dto, ct);
                if (!validationResult.IsValid)
                {
                    Log.Warning("AddAsync - Validation failed for {EntityName}: {Errors}", _entityName, string.Join(", ", validationResult.Errors));
                    throw new ValidationException(validationResult.Errors);
                }

                // Map DTO to Entity
                entity = _mapper.Map<TEntity>(dto);

                // Set audit fields
                SetAuditFields(entity, userEmail, isCreate: true);

                // Execute in transaction with proper error handling
                TKey id;
                try
                {
                    await _unitOfWork.BeginTransactionAsync(IsolationLevel.ReadCommitted);

                    id = await _repository.AddAsync(entity, ct);
                    SetEntityId(entity, id);

                    await _unitOfWork.CommitAsync();

                    Log.Information("AddAsync - {EntityName} created successfully with Id={Id} by {User}", _entityName, id, userEmail);
                }
                catch (Exception)
                {
                    Log.Warning("AddAsync - Rolling back transaction for {EntityName}", _entityName);
                    await _unitOfWork.RollbackAsync();
                    throw;
                }

                return id;
            }
            catch (ValidationException)
            {
                throw; // Re-throw validation exceptions
            }
            catch (Exception ex)
            {
                Log.Error(ex, "AddAsync - Failed to create {EntityName}. Entity: {@Entity}", _entityName, entity);
                throw;
            }
        }

        public virtual async Task UpdateAsync(TKey id, TRequestDto dto, string userEmail, CancellationToken ct = default)
        {
            ArgumentNullException.ThrowIfNull(dto);
            ArgumentException.ThrowIfNullOrWhiteSpace(userEmail);

            try
            {
                Log.Information("UpdateAsync - Updating {EntityName} with Id={Id} by {User}", _entityName, id, userEmail);

                // Validate DTO
                var validationResult = await _validator.ValidateAsync(dto, ct);
                if (!validationResult.IsValid)
                {
                    Log.Warning("UpdateAsync - Validation failed for {EntityName} with Id={Id}: {Errors}", _entityName, id, string.Join(", ", validationResult.Errors));
                    throw new ValidationException(validationResult.Errors);
                }

                // Check if entity exists
                var existing = await _repository.GetByIdAsync(id, ct);
                if (existing == null)
                {
                    Log.Warning("UpdateAsync - {EntityName} with Id={Id} not found", _entityName, id);
                    throw new KeyNotFoundException($"{_entityName} with id {id} not found.");
                }

                // Map DTO to existing entity
                _mapper.Map(dto, existing);

                // Set audit fields
                SetAuditFields(existing, userEmail, isCreate: false);

                // Execute in transaction with proper error handling
                try
                {
                    await _unitOfWork.BeginTransactionAsync(IsolationLevel.ReadCommitted);

                    await _repository.UpdateAsync(existing, ct);

                    await _unitOfWork.CommitAsync();

                    Log.Information("UpdateAsync - {EntityName} with Id={Id} updated successfully by {User}", _entityName, id, userEmail);
                }
                catch (Exception)
                {
                    Log.Warning("UpdateAsync - Rolling back transaction for {EntityName} with Id={Id}", _entityName, id);
                    await _unitOfWork.RollbackAsync();
                    throw;
                }
            }
            catch (ValidationException)
            {
                throw; // Re-throw validation exceptions
            }
            catch (KeyNotFoundException)
            {
                throw; // Re-throw not found exceptions
            }
            catch (Exception ex)
            {
                Log.Error(ex, "UpdateAsync - Failed to update {EntityName} with Id={Id}", _entityName, id);
                throw;
            }
        }

        public virtual async Task DeleteAsync(
            TKey id,
            string userEmail,
            CancellationToken ct = default)
        {
            ArgumentException.ThrowIfNullOrWhiteSpace(userEmail);

            try
            {
                Log.Information("DeleteAsync - Deleting {EntityName} with Id={Id} by {User}", _entityName, id, userEmail);

                // Check if entity exists
                var existing = await _repository.GetByIdAsync(id, ct);
                if (existing == null)
                {
                    Log.Warning("DeleteAsync - {EntityName} with Id={Id} not found", _entityName, id);
                    throw new KeyNotFoundException($"{_entityName} with id {id} not found.");
                }

                // Execute in transaction with proper error handling
                try
                {
                    await _unitOfWork.BeginTransactionAsync(IsolationLevel.ReadCommitted);

                    await _repository.DeleteAsync(id, ct);

                    //if (!deleted)
                    //{
                    //    throw new InvalidOperationException(
                    //        $"Failed to delete {_entityName} with id {id}");
                    //}

                    await _unitOfWork.CommitAsync();

                    Log.Information("DeleteAsync - {EntityName} with Id={Id} deleted successfully by {User}", _entityName, id, userEmail);
                }
                catch (Exception)
                {
                    Log.Warning("DeleteAsync - Rolling back transaction for {EntityName} with Id={Id}", _entityName, id);
                    await _unitOfWork.RollbackAsync();
                    throw;
                }
            }
            catch (KeyNotFoundException)
            {
                throw; // Re-throw not found exceptions
            }
            catch (Exception ex)
            {
                Log.Error(ex, "DeleteAsync - Failed to delete {EntityName} with Id={Id}", _entityName, id);
                throw;
            }
        }

        public virtual async Task DeleteMultiAsync(
            IEnumerable<TKey> ids,
            CancellationToken ct = default)
        {
            var idList = ids?.ToList();
            if (idList == null || !idList.Any())
            {
                throw new ArgumentException("Ids cannot be null or empty", nameof(ids));
            }

            try
            {
                Log.Information("DeleteMultiAsync - Deleting {Count} {EntityName} records", idList.Count, _entityName);

                // Execute in transaction with proper error handling
                try
                {
                    await _unitOfWork.BeginTransactionAsync(IsolationLevel.ReadCommitted);

                    // Use bulk delete if available in repository
                    int deletedCount;

                    // Check if repository has DeleteManyAsync method
                    var deleteMany = _repository.GetType().GetMethod("DeleteManyAsync");

                    if (deleteMany != null)
                    {
                        // Use bulk delete
                        deletedCount = await (Task<int>)deleteMany.Invoke(_repository, new object[] { idList, ct })!;
                    }
                    else
                    {
                        // Fall back to individual deletes
                        deletedCount = 0;
                        foreach (var id in idList)
                        {
                            await _repository.DeleteAsync(id, ct);
                        }
                    }

                    await _unitOfWork.CommitAsync();

                    Log.Information("DeleteMultiAsync - Deleted {DeletedCount} of {TotalCount} {EntityName} records", deletedCount, idList.Count, _entityName);

                    if (deletedCount < idList.Count)
                    {
                        Log.Warning("DeleteMultiAsync - Some {EntityName} records were not found: " +
                                   "{NotDeleted} out of {Total}", _entityName, idList.Count - deletedCount, idList.Count);
                    }
                }
                catch (Exception)
                {
                    Log.Warning("DeleteMultiAsync - Rolling back transaction for {EntityName}", _entityName);
                    await _unitOfWork.RollbackAsync();
                    throw;
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "DeleteMultiAsync - Failed to delete {EntityName} records", _entityName);
                throw;
            }
        }

        // ====================================================================
        // HELPER METHODS
        // ====================================================================

        /// <summary>
        /// Set audit fields (CreatedBy, CreatedDate, UpdatedBy, UpdatedDate) if they exist
        /// </summary>
        protected virtual void SetAuditFields(TEntity entity, string userEmail, bool isCreate)
        {
            var now = DateTime.UtcNow;
            var type = typeof(TEntity);

            // Always set UpdatedBy and UpdatedDate
            var updatedDateProp = type.GetProperty("UpdatedDate");
            var updatedByProp = type.GetProperty("UpdatedBy");

            updatedDateProp?.SetValue(entity, now);
            updatedByProp?.SetValue(entity, userEmail);

            // Set CreatedBy and CreatedDate only on create
            if (isCreate)
            {
                var createdDateProp = type.GetProperty("CreatedDate");
                var createdByProp = type.GetProperty("CreatedBy");

                createdDateProp?.SetValue(entity, now);
                createdByProp?.SetValue(entity, userEmail);
            }

            Log.Debug("SetAuditFields - Audit fields set for {EntityName} by {User}", _entityName, userEmail);
        }

        /// <summary>
        /// Set Id property value after insert
        /// </summary>
        protected virtual void SetEntityId(TEntity entity, object id)
        {
            var prop = typeof(TEntity).GetProperty("Id");

            if (prop == null || !prop.CanWrite)
                return;

            try
            {
                object valueToSet;

                if (prop.PropertyType == typeof(Guid))
                {
                    valueToSet = id switch
                    {
                        Guid g => g,
                        string s => Guid.Parse(s),
                        _ => Guid.Parse(id.ToString()!)
                    };
                }
                else
                {
                    valueToSet = Convert.ChangeType(id, prop.PropertyType);
                }

                prop.SetValue(entity, valueToSet);
                Log.Debug("SetEntityId - Id set to {Id} for {EntityName}", valueToSet, _entityName);
            }
            catch (Exception ex)
            {
                Log.Warning(ex, "SetEntityId - Failed to set Id property for {EntityName}", _entityName);
                // Don't throw - this is not critical
            }
        }
    }
}