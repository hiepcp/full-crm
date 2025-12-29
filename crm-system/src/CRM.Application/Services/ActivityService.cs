using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using FluentValidation.Results;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Serilog;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Activity service implementation with business logic
    /// </summary>
    public class ActivityService : BaseService<Activity, long, CreateActivityRequest>, IActivityService
    {
        private readonly IActivityRepository _activityRepository;
        private readonly IRepository<Activity, long> _activityRepositoryBase;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateActivityRequest> _createValidator;
        private readonly IValidator<UpdateActivityRequest> _updateValidator;
        private readonly IContactRepository _contactRepository;
        private readonly IUserRepository _userRepository;
        private readonly IActivityParticipantService _activityParticipantService;
        private readonly IActivityAttachmentService _activityAttachmentService;
        private readonly IActivityParticipantRepository _activityParticipantRepository;
        private readonly IActivityAttachmentRepository _activityAttachmentRepository;
        private readonly IValidator<CreateActivityParticipantRequest> _participantCreateValidator;
        private readonly IValidator<CreateActivityAttachmentRequest> _attachmentCreateValidator;
        private readonly ICRMUploadService _crmUploadService;
        private readonly Shared.ExternalServices.Interfaces.ISharepointService _sharepointService;
        private readonly IRepository<CRMSharepointFile, long> _crmSharepointFileRepository;
        private readonly IConfiguration _configuration;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IGoalProgressCalculationService? _goalCalculationService;

        private string ActivityFolderPath => _configuration["Sharepoint:ActivityFolderPath"] ?? "DEV/CRM";

        public ActivityService(
            IRepository<Activity, long> repository,
            IRepository<Activity, long> activityRepositoryBase,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateActivityRequest> createValidator,
            IValidator<UpdateActivityRequest> updateValidator,
            IActivityRepository activityRepository,
            IContactRepository contactRepository,
            IUserRepository userRepository,
            IActivityParticipantService activityParticipantService,
            IActivityAttachmentService activityAttachmentService,
            IActivityParticipantRepository activityParticipantRepository,
            IActivityAttachmentRepository activityAttachmentRepository,
            IValidator<CreateActivityParticipantRequest> participantCreateValidator,
            IValidator<CreateActivityAttachmentRequest> attachmentCreateValidator,
            ICRMUploadService crmUploadService,
            Shared.ExternalServices.Interfaces.ISharepointService sharepointService,
            IRepository<CRMSharepointFile, long> crmSharepointFileRepository,
            IConfiguration configuration,
            IGoalProgressCalculationService? goalCalculationService = null)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _activityRepository = activityRepository;
            _activityRepositoryBase = activityRepositoryBase;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
            _contactRepository = contactRepository;
            _userRepository = userRepository;
            _activityParticipantService = activityParticipantService;
            _activityAttachmentService = activityAttachmentService;
            _activityParticipantRepository = activityParticipantRepository;
            _activityAttachmentRepository = activityAttachmentRepository;
            _participantCreateValidator = participantCreateValidator;
            _attachmentCreateValidator = attachmentCreateValidator;
            _crmUploadService = crmUploadService;
            _sharepointService = sharepointService;
            _crmSharepointFileRepository = crmSharepointFileRepository;
            _configuration = configuration;
            _unitOfWork = unitOfWork;
            _goalCalculationService = goalCalculationService;
        }

        /// <summary>
        /// Query activities with advanced filtering, pagination, ordering and field selection
        /// </summary>
        public async Task<PagedResult<ActivityResponse>> QueryAsync(ActivityQueryRequest request, CancellationToken ct = default)
        {
            var result = await _activityRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<ActivityResponse>>(result.Items);

            return new PagedResult<ActivityResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        /// <summary>
        /// Get activity by ID
        /// </summary>
        public new async Task<ActivityResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var activity = await base.GetByIdAsync(id, ct);
                return _mapper.Map<ActivityResponse>(activity);
            }
            catch (KeyNotFoundException)
            {
                return null;
            }
        }

        /// <summary>
        /// Create new activity with validation
        /// </summary>
        public async Task<long> CreateAsync(CreateActivityRequest request, string userEmail, CancellationToken ct = default)
        {
            // Additional business validation
            if (!string.IsNullOrEmpty(request.Subject) && request.Subject.Length > 500)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Subject), "Subject cannot exceed 500 characters.")
                });
            }

            // Business rules validation
            if (request.DueAt.HasValue && request.DueAt.Value < DateTime.UtcNow)
            {
                // Warning: Due date is in the past, but allow creation
            }

            if (request.ActivityType == "task" && !request.DueAt.HasValue)
            {
                // Warning: Tasks should have due dates, but allow creation
            }

            return await base.AddAsync(request, userEmail, ct);
        }

        /// <summary>
        /// Update existing activity
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateActivityRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate update request
            var validationResult = await _updateValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Additional business validation
            if (!string.IsNullOrEmpty(request.Subject) && request.Subject.Length > 500)
            {
                throw new ValidationException(new[] {
                    new ValidationFailure(nameof(request.Subject), "Subject cannot exceed 500 characters.")
                });
            }

            // Get existing activity to check if status changed to "Completed"
            var existingActivity = await _activityRepository.GetByIdAsync(id, ct);
            var wasNotCompleted = existingActivity != null && existingActivity.Status != "Completed";
            var nowCompleted = !string.IsNullOrEmpty(request.Status) && request.Status == "Completed";

            // Start transaction for the update operation
            await _unitOfWork.BeginTransactionAsync();

            try
            {
                await base.UpdateAsync(id, _mapper.Map<CreateActivityRequest>(request), userEmail, ct);

                // Trigger goal recalculation if activity was completed (US1: T037)
                if (wasNotCompleted && nowCompleted && _goalCalculationService != null)
                {
                    try
                    {
                        await _goalCalculationService.RecalculateGoalsForEntityAsync("activity", id, ct);
                        Log.Information("Triggered goal recalculation for activity {ActivityId} marked as Completed", id);
                    }
                    catch (Exception ex)
                    {
                        // Log but don't fail the activity update if goal recalculation fails
                        Log.Warning(ex, "Failed to trigger goal recalculation for activity {ActivityId}", id);
                    }
                }

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
        /// Delete activity by ID
        /// </summary>
        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var activity = await GetByIdAsync(id);
            if (activity == null)
                return false;

            // Business rule: Don't delete completed activities
            if (activity.Status == "completed")
            {
                throw new InvalidOperationException("Cannot delete a completed activity.");
            }

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
        /// Create activity with participants and attachments in a single transaction
        /// </summary>
        public async Task<long> CreateWithParticipantsAndAttachmentsAsync(
            CreateActivityWithParticipantsAndAttachmentsRequest request,
            List<IFormFile> files,
            string userEmail,
            CancellationToken ct = default)
        {
            // Validate activity request
            var validationResult = await _createValidator.ValidateAsync(request.Activity);
            if (!validationResult.IsValid)
            {
                throw new ValidationException(validationResult.Errors);
            }

            // Start transaction for all operations
            await _unitOfWork.BeginTransactionAsync();

            try
            {
                // Create activity entity (replicate BaseService.AddAsync logic without commit)
                var activityEntity = _mapper.Map<Activity>(request.Activity);
                SetAuditFields(activityEntity, userEmail, isCreate: true);
                var activityId = await _activityRepositoryBase.AddAsync(activityEntity, ct);

                // Create participants from Participants array
                if (request.Participants != null && request.Participants.Any())
                {
                    foreach (var participantInput in request.Participants)
                    {
                        var participantRequest = new CreateActivityParticipantRequest
                        {
                            ActivityId = activityId,
                            ContactId = participantInput.ContactId,
                            UserId = participantInput.UserId,
                            Role = participantInput.Role
                        };

                        // Validate participant request
                        var participantValidation = await _participantCreateValidator.ValidateAsync(participantRequest);
                        if (!participantValidation.IsValid)
                        {
                            throw new ValidationException(participantValidation.Errors);
                        }

                        var participantEntity = _mapper.Map<ActivityParticipant>(participantRequest);
                        SetAuditFields(participantEntity, userEmail, isCreate: true);
                        await _activityParticipantRepository.CreateAsync(participantEntity, ct);
                    }
                }

                // Create participants from email recipients
                if (request.EmailRecipients != null && request.EmailRecipients.Any())
                {
                    foreach (var email in request.EmailRecipients)
                    {
                        // Try to find contact by email
                        var contact = await _contactRepository.GetByEmailAsync(email, ct);

                        // If not found as contact, try to find as user
                        var user = contact == null ? await _userRepository.GetByEmailAsync(email, ct) : null;

                        if (contact != null || user != null)
                        {
                            var participantRequest = new CreateActivityParticipantRequest
                            {
                                ActivityId = activityId,
                                ContactId = contact?.Id,
                                UserId = user?.Id,
                                Role = "to" // Default role for email recipients
                            };

                            // Validate participant request
                            var participantValidation = await _participantCreateValidator.ValidateAsync(participantRequest);
                            if (!participantValidation.IsValid)
                            {
                                throw new ValidationException(participantValidation.Errors);
                            }

                            var participantEntity = _mapper.Map<ActivityParticipant>(participantRequest);
                            SetAuditFields(participantEntity, userEmail, isCreate: true);
                            await _activityParticipantRepository.CreateAsync(participantEntity, ct);
                        }
                    }
                }

                // Upload files and create attachments
                if (files != null && files.Any())
                {
                    foreach (var file in files)
                    {
                        // Generate unique filename
                        string baseFileName = string.IsNullOrWhiteSpace(file.FileName) ? file.FileName : file.FileName;
                        string uniqueFileName = GetUniqueFileName(baseFileName);
                        string folderPath = ActivityFolderPath + "/" + (request.Activity.RelationType ?? "unknown") + "/" + (request.Activity.RelationId?.ToString() ?? "0");

                        // Upload to SharePoint
                        using var stream = file.OpenReadStream();
                        var sharepointResult = await _sharepointService.UploadFile(folderPath, uniqueFileName, stream);

                        // Create CRMSharepointFile record
                        var crmFile = new CRMSharepointFile
                        {
                            ItemId = sharepointResult!.Id,
                            DriveId = sharepointResult.ParentReference?.DriveId ?? "",
                            Name = sharepointResult.Name,
                            WebUrl = sharepointResult.WebUrl,
                            DownloadUrl = sharepointResult.WebUrl,
                            MimeType = sharepointResult.File?.MimeType,
                            Size = sharepointResult.Size != 0 ? (long?)long.Parse(sharepointResult.Size.ToString()) : null,
                            ETag = sharepointResult.ETag,
                            CTag = sharepointResult.CTag,
                            CreatedDateTime = sharepointResult.CreatedDateTime,
                            LastModifiedBy = sharepointResult.LastModifiedBy?.User?.DisplayName,
                            LastModifiedDateTime = sharepointResult.LastModifiedDateTime,
                            ParentId = sharepointResult.ParentReference?.Id,
                            ParentName = sharepointResult.ParentReference?.Name,
                            ParentPath = sharepointResult.ParentReference?.Path,
                            RawJson = System.Text.Json.JsonSerializer.Serialize(sharepointResult)
                        };

                        // Save CRMSharepointFile to database (within transaction)
                        SetAuditFields(crmFile, userEmail, isCreate: true);
                        await _crmSharepointFileRepository.AddAsync(crmFile, ct);

                        // Create attachment record
                        var attachmentRequest = new CreateActivityAttachmentRequest
                        {
                            ActivityId = activityId,
                            IdRef = sharepointResult.Id,
                            FileName = file.FileName,
                            FilePath = folderPath + "/" + uniqueFileName,
                            FileSize = file.Length,
                            MimeType = file.ContentType,
                        };

                        // Validate attachment request
                        var attachmentValidation = await _attachmentCreateValidator.ValidateAsync(attachmentRequest);
                        if (!attachmentValidation.IsValid)
                        {
                            throw new ValidationException(attachmentValidation.Errors);
                        }

                        var attachmentEntity = _mapper.Map<ActivityAttachment>(attachmentRequest);
                        SetAuditFields(attachmentEntity, userEmail, isCreate: true);
                        await _activityAttachmentRepository.CreateAsync(attachmentEntity, ct);
                    }
                }

                // Commit transaction
                await _unitOfWork.CommitAsync();

                return activityId;
            }
            catch
            {
                // Rollback transaction on error
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        // Helper: Set audit fields if exist
        private void SetAuditFields(object entity, string userEmail, bool isCreate)
        {
            var now = DateTime.UtcNow;
            var type = entity.GetType();

            var updatedDateProp = type.GetProperty("UpdatedOn");
            var updatedByProp = type.GetProperty("UpdatedBy");
            updatedDateProp?.SetValue(entity, now);
            updatedByProp?.SetValue(entity, userEmail);

            if (isCreate)
            {
                var createdDateProp = type.GetProperty("CreatedOn");
                var createdByProp = type.GetProperty("CreatedBy");
                createdDateProp?.SetValue(entity, now);
                createdByProp?.SetValue(entity, userEmail);
            }
        }

        // Helper: Generate unique filename
        private string GetUniqueFileName(string originalFileName)
        {
            // Get file name without extension and the extension
            string fileNameWithoutExtension = Path.GetFileNameWithoutExtension(originalFileName);
            string extension = Path.GetExtension(originalFileName);

            // Generate timestamp in format yyyyMMddHHmmss
            string timestamp = DateTime.UtcNow.ToString("yyyyMMddHHmmss");

            // Generate random string (6 characters)
            string randomString = Guid.NewGuid().ToString("N").Substring(0, 6);

            // Combine all parts: originalname_timestamp_random.extension
            string uniqueFileName = $"{fileNameWithoutExtension}_{timestamp}_{randomString}{extension}";

            return uniqueFileName;
        }

    }
}
