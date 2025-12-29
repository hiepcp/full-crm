using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Domain.Entities;
using Microsoft.Extensions.Logging;
using Shared.Dapper.Interfaces;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Service for managing goal hierarchy (parent-child relationships) and progress roll-up
    /// Supports OKR-style cascading goals: Company → Team → Individual
    /// </summary>
    public class GoalHierarchyService : IGoalHierarchyService
    {
        private readonly IGoalRepository _goalRepository;
        private readonly IGoalAuditLogRepository _auditLogRepository;
        private readonly IUserRepository _userRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly ILogger<GoalHierarchyService> _logger;

        public GoalHierarchyService(
            IGoalRepository goalRepository,
            IGoalAuditLogRepository auditLogRepository,
            IUserRepository userRepository,
            IUnitOfWork unitOfWork,
            ILogger<GoalHierarchyService> logger)
        {
            _goalRepository = goalRepository;
            _auditLogRepository = auditLogRepository;
            _userRepository = userRepository;
            _unitOfWork = unitOfWork;
            _logger = logger;
        }

        public async Task<GoalResponse?> LinkToParentAsync(long childGoalId, long parentGoalId, string userEmail, CancellationToken ct = default)
        {
            var child = await _goalRepository.GetByIdAsync(childGoalId, ct);
            if (child == null)
            {
                _logger.LogWarning("Child goal {ChildGoalId} not found", childGoalId);
                return null;
            }

            var parent = await _goalRepository.GetByIdAsync(parentGoalId, ct);
            if (parent == null)
            {
                _logger.LogWarning("Parent goal {ParentGoalId} not found", parentGoalId);
                return null;
            }

            // Validation
            var validationResult = await ValidateHierarchyLinkAsync(childGoalId, parentGoalId, ct);
            if (!validationResult.IsValid)
            {
                throw new InvalidOperationException(validationResult.ErrorMessage);
            }

            var ownerTypeValidation = ValidateCompatibleOwnerTypes(child, parent);
            if (!ownerTypeValidation.IsValid)
            {
                throw new InvalidOperationException(ownerTypeValidation.ErrorMessage);
            }

            var depthValidation = await ValidateMaxDepthAsync(parentGoalId, ct);
            if (!depthValidation.IsValid)
            {
                throw new InvalidOperationException(depthValidation.ErrorMessage);
            }

            // Link child to parent
            var oldParentId = child.ParentGoalId;
            child.ParentGoalId = parentGoalId;
            child.UpdatedOn = DateTime.UtcNow;
            child.UpdatedBy = userEmail;

            await _goalRepository.UpdateAsync(child, ct);

            // Get user ID for audit log
            var user = await _userRepository.GetByEmailAsync(userEmail, ct);

            // Create audit log entry
            await _auditLogRepository.CreateAsync(new GoalAuditLog
            {
                GoalId = childGoalId,
                EventType = "hierarchy_link",
                BeforeValue = oldParentId?.ToString() ?? "null",
                AfterValue = parentGoalId.ToString(),
                ChangeDetails = $"{{\"action\":\"link_to_parent\",\"parentGoalId\":{parentGoalId},\"parentGoalName\":\"{parent.Name}\"}}",
                ChangedBy = user?.Id,
                ChangedOn = DateTime.UtcNow
            }, ct);

            _logger.LogInformation(
                "Goal {ChildGoalId} linked to parent {ParentGoalId} by {UserEmail}",
                childGoalId, parentGoalId, userEmail);

            // Recalculate parent progress
            await RecalculateParentProgressAsync(childGoalId, ct);

            return MapToResponse(child);
        }

        public async Task<GoalResponse?> UnlinkFromParentAsync(long childGoalId, string userEmail, CancellationToken ct = default)
        {
            var child = await _goalRepository.GetByIdAsync(childGoalId, ct);
            if (child == null)
            {
                _logger.LogWarning("Child goal {ChildGoalId} not found", childGoalId);
                return null;
            }

            if (!child.ParentGoalId.HasValue)
            {
                _logger.LogInformation("Goal {ChildGoalId} has no parent to unlink", childGoalId);
                return MapToResponse(child);
            }

            var oldParentId = child.ParentGoalId.Value;

            // Unlink from parent
            child.ParentGoalId = null;
            child.UpdatedOn = DateTime.UtcNow;
            child.UpdatedBy = userEmail;

            await _goalRepository.UpdateAsync(child, ct);

            // Get user ID for audit log
            var user = await _userRepository.GetByEmailAsync(userEmail, ct);

            // Create audit log entry
            await _auditLogRepository.CreateAsync(new GoalAuditLog
            {
                GoalId = childGoalId,
                EventType = "hierarchy_unlink",
                BeforeValue = oldParentId.ToString(),
                AfterValue = "null",
                ChangeDetails = $"{{\"action\":\"unlink_from_parent\",\"oldParentGoalId\":{oldParentId}}}",
                ChangedBy = user?.Id,
                ChangedOn = DateTime.UtcNow
            }, ct);

            _logger.LogInformation(
                "Goal {ChildGoalId} unlinked from parent {OldParentId} by {UserEmail}",
                childGoalId, oldParentId, userEmail);

            // Recalculate old parent progress (it just lost a child)
            await RecalculateParentProgressAsync(oldParentId, ct);

            return MapToResponse(child);
        }

        public async Task<GoalHierarchyResponse?> GetHierarchyAsync(long goalId, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(goalId, ct);
            if (goal == null)
            {
                _logger.LogWarning("Goal {GoalId} not found for hierarchy retrieval", goalId);
                return null;
            }

            // Get ancestors (parent, grandparent, etc.)
            var ancestors = await _goalRepository.GetAncestorsAsync(goalId, ct);
            var ancestorList = ancestors.ToList();

            // Get direct children
            var children = await _goalRepository.GetChildrenAsync(goalId, ct);
            var childrenList = children.ToList();

            // Get all descendants (children, grandchildren, etc.)
            var descendants = await _goalRepository.GetDescendantsAsync(goalId, ct);
            var descendantsList = descendants.Where(d => d.Id != goalId).ToList(); // Exclude the goal itself

            // Calculate aggregated child progress
            decimal? aggregatedProgress = null;
            decimal? aggregatedTarget = null;

            if (childrenList.Any())
            {
                aggregatedProgress = childrenList.Sum(c => c.Progress);
                aggregatedTarget = childrenList.Sum(c => c.TargetValue ?? 0);
            }

            return new GoalHierarchyResponse
            {
                Goal = MapToResponse(goal),
                Ancestors = ancestorList.Select(MapToResponse).ToList(),
                Children = childrenList.Select(MapToResponse).ToList(),
                Descendants = descendantsList.Select(MapToResponse).ToList(),
                Depth = ancestorList.Count,
                AggregatedChildProgress = aggregatedProgress,
                AggregatedChildTarget = aggregatedTarget
            };
        }

        public async Task<IEnumerable<GoalResponse>> GetChildrenAsync(long parentGoalId, CancellationToken ct = default)
        {
            var children = await _goalRepository.GetChildrenAsync(parentGoalId, ct);
            return children.Select(MapToResponse);
        }

        public async Task RecalculateParentProgressAsync(long goalId, CancellationToken ct = default)
        {
            var goal = await _goalRepository.GetByIdAsync(goalId, ct);
            if (goal == null || !goal.ParentGoalId.HasValue)
            {
                return; // No parent to recalculate
            }

            var parentId = goal.ParentGoalId.Value;
            var parent = await _goalRepository.GetByIdAsync(parentId, ct);
            if (parent == null)
            {
                _logger.LogWarning("Parent goal {ParentId} not found for recalculation", parentId);
                return;
            }

            // Get all children of parent (siblings of current goal)
            var siblings = await _goalRepository.GetChildrenAsync(parentId, ct);
            var siblingList = siblings.ToList();

            if (!siblingList.Any())
            {
                _logger.LogInformation("Parent goal {ParentId} has no children, skipping recalculation", parentId);
                return;
            }

            // Calculate aggregate progress (sum of all children progress)
            var totalProgress = siblingList.Sum(s => s.Progress);
            var totalTarget = siblingList.Sum(s => s.TargetValue ?? 0);

            var oldProgress = parent.Progress;
            var oldProgressPercentage = parent.ProgressPercentage;

            // Update parent goal
            parent.Progress = totalProgress;
            parent.TargetValue = totalTarget > 0 ? totalTarget : null;
            parent.UpdatedOn = DateTime.UtcNow;
            parent.UpdatedBy = "system"; // System-generated update

            await _goalRepository.UpdateAsync(parent, ct);

            // Create audit log entry
            await _auditLogRepository.CreateAsync(new GoalAuditLog
            {
                GoalId = parentId,
                EventType = "hierarchy_rollup",
                BeforeValue = oldProgress.ToString("F2"),
                AfterValue = totalProgress.ToString("F2"),
                ChangeDetails = $"{{\"action\":\"parent_recalculation\",\"childCount\":{siblingList.Count},\"aggregatedProgress\":{totalProgress},\"aggregatedTarget\":{totalTarget}}}",
                ChangedBy = null, // System event
                ChangedOn = DateTime.UtcNow
            }, ct);

            _logger.LogInformation(
                "Parent goal {ParentId} progress recalculated: {OldProgress} → {NewProgress} ({ChildCount} children)",
                parentId, oldProgress, totalProgress, siblingList.Count);

            // Recursively recalculate grandparent if exists
            if (parent.ParentGoalId.HasValue)
            {
                await RecalculateParentProgressAsync(parent.Id, ct);
            }
        }

        public async Task<(bool IsValid, string? ErrorMessage)> ValidateHierarchyLinkAsync(long childGoalId, long parentGoalId, CancellationToken ct = default)
        {
            // Rule 1: Can't link to self
            if (childGoalId == parentGoalId)
            {
                return (false, "Cannot link a goal to itself");
            }

            // Rule 2: Check for circular dependency (proposed parent is descendant of child)
            var childDescendants = await _goalRepository.GetDescendantsAsync(childGoalId, ct);
            var descendantIds = childDescendants.Select(d => d.Id).ToList();

            if (descendantIds.Contains(parentGoalId))
            {
                return (false, $"Circular dependency detected: Parent goal {parentGoalId} is a descendant of child goal {childGoalId}");
            }

            return (true, null);
        }

        public async Task<(bool IsValid, string? ErrorMessage)> ValidateMaxDepthAsync(long parentGoalId, CancellationToken ct = default)
        {
            var ancestors = await _goalRepository.GetAncestorsAsync(parentGoalId, ct);
            var ancestorCount = ancestors.Count();

            // Max depth is 3 levels (company → team → individual)
            // If parent already has 2 ancestors, adding a child would create 4 levels
            const int MaxDepth = 2;

            if (ancestorCount >= MaxDepth)
            {
                return (false, $"Maximum hierarchy depth exceeded. Parent goal {parentGoalId} already has {ancestorCount} ancestors (max allowed: {MaxDepth})");
            }

            return (true, null);
        }

        public (bool IsValid, string? ErrorMessage) ValidateCompatibleOwnerTypes(Goal childGoal, Goal parentGoal)
        {
            // Compatible owner type hierarchy:
            // - Company can have Team or Individual children
            // - Team can have Individual children
            // - Individual can have no children (leaf nodes)

            var parentType = parentGoal.OwnerType?.ToLower() ?? "individual";
            var childType = childGoal.OwnerType?.ToLower() ?? "individual";

            var isValid = (parentType, childType) switch
            {
                ("company", "team") => true,
                ("company", "individual") => true,
                ("team", "individual") => true,
                _ => false
            };

            if (!isValid)
            {
                return (false, $"Incompatible owner types: {parentType} goal cannot have {childType} child. Valid combinations: company→team, company→individual, team→individual");
            }

            return (true, null);
        }

        // === Helper Methods ===

        private GoalResponse MapToResponse(Goal goal)
        {
            return new GoalResponse
            {
                Id = goal.Id,
                CreatedOn = goal.CreatedOn,
                CreatedBy = goal.CreatedBy,
                UpdatedOn = goal.UpdatedOn,
                UpdatedBy = goal.UpdatedBy,
                Name = goal.Name,
                Description = goal.Description,
                TargetValue = goal.TargetValue,
                Progress = goal.Progress,
                StartDate = goal.StartDate,
                EndDate = goal.EndDate,
                OwnerUserId = goal.OwnerUserId,
                OwnerType = goal.OwnerType,
                OwnerId = goal.OwnerId,
                Type = goal.Type,
                Timeframe = goal.Timeframe,
                Recurring = goal.Recurring,
                Status = goal.Status,
                ParentGoalId = goal.ParentGoalId,
                CalculationSource = goal.CalculationSource,
                LastCalculatedAt = goal.LastCalculatedAt,
                CalculationFailed = goal.CalculationFailed,
                ManualOverrideReason = goal.ManualOverrideReason
            };
        }
    }
}
