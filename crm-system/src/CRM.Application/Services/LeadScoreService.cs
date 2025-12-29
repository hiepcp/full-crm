using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using Serilog;
using Shared.Dapper.Interfaces;
using System.Reflection;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Service implementation for Lead Score operations - simplified single-table design
    /// </summary>
    public class LeadScoreService : ILeadScoreService
    {
        private readonly ILeadScoreRuleRepository _ruleRepository;
        private readonly IMapper _mapper;

        public LeadScoreService(
            ILeadScoreRuleRepository ruleRepository,
            IMapper mapper)
        {
            _ruleRepository = ruleRepository;
            _mapper = mapper;
        }

        #region Rule CRUD Operations

        /// <summary>
        /// Get all lead score rules
        /// </summary>
        public async Task<IEnumerable<LeadScoreRuleResponse>> GetAllRulesAsync(CancellationToken ct = default)
        {
            try
            {
                var rules = await _ruleRepository.GetAllAsync(ct);
                return _mapper.Map<IEnumerable<LeadScoreRuleResponse>>(rules);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting all lead score rules");
                throw;
            }
        }

        /// <summary>
        /// Get active lead score rules only
        /// </summary>
        public async Task<IEnumerable<LeadScoreRuleResponse>> GetActiveRulesAsync(CancellationToken ct = default)
        {
            try
            {
                var rules = await _ruleRepository.GetActiveAsync(ct);
                return _mapper.Map<IEnumerable<LeadScoreRuleResponse>>(rules);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting active lead score rules");
                throw;
            }
        }

        /// <summary>
        /// Get lead score rule by ID
        /// </summary>
        public async Task<LeadScoreRuleResponse?> GetRuleByIdAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var rule = await _ruleRepository.GetByIdAsync(id, ct);
                return rule == null ? null : _mapper.Map<LeadScoreRuleResponse>(rule);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting lead score rule by ID: {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// Create new lead score rule
        /// </summary>
        public async Task<LeadScoreRuleResponse> CreateRuleAsync(CreateLeadScoreRuleRequest request, string createdBy, CancellationToken ct = default)
        {
            try
            {
                // Check if field name already exists
                var existing = await _ruleRepository.GetByFieldNameAsync(request.FieldName, ct);
                if (existing != null)
                {
                    throw new InvalidOperationException($"Rule for field '{request.FieldName}' already exists");
                }

                var rule = new LeadScoreRule
                {
                    RuleName = request.RuleName,
                    Description = request.Description,
                    FieldName = request.FieldName,
                    Score = request.Score,
                    IsActive = request.IsActive,
                    CreatedOn = DateTime.UtcNow,
                    CreatedBy = createdBy,
                    UpdatedOn = DateTime.UtcNow,
                    UpdatedBy = createdBy
                };

                var id = await _ruleRepository.CreateAsync(rule, ct);
                rule.Id = id;
                return _mapper.Map<LeadScoreRuleResponse>(rule);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error creating lead score rule");
                throw;
            }
        }

        /// <summary>
        /// Update existing lead score rule
        /// </summary>
        public async Task<LeadScoreRuleResponse> UpdateRuleAsync(long id, UpdateLeadScoreRuleRequest request, string updatedBy, CancellationToken ct = default)
        {
            try
            {
                var rule = await _ruleRepository.GetByIdAsync(id, ct);
                if (rule == null)
                {
                    throw new KeyNotFoundException($"Rule with ID {id} not found");
                }

                // Check if new field name conflicts with another rule
                if (request.FieldName != null && request.FieldName != rule.FieldName)
                {
                    var existing = await _ruleRepository.GetByFieldNameAsync(request.FieldName, ct);
                    if (existing != null && existing.Id != id)
                    {
                        throw new InvalidOperationException($"Rule for field '{request.FieldName}' already exists");
                    }
                }

                // Update fields
                if (request.RuleName != null) rule.RuleName = request.RuleName;
                if (request.Description != null) rule.Description = request.Description;
                if (request.FieldName != null) rule.FieldName = request.FieldName;
                if (request.Score.HasValue) rule.Score = request.Score.Value;
                if (request.IsActive.HasValue) rule.IsActive = request.IsActive.Value;

                rule.UpdatedOn = DateTime.UtcNow;
                rule.UpdatedBy = updatedBy;

                await _ruleRepository.UpdateAsync(rule, ct);

                return _mapper.Map<LeadScoreRuleResponse>(rule);
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error updating lead score rule {Id}", id);
                throw;
            }
        }

        /// <summary>
        /// Delete lead score rule (soft delete)
        /// </summary>
        public async Task<bool> DeleteRuleAsync(long id, CancellationToken ct = default)
        {
            try
            {
                var rule = await _ruleRepository.GetByIdAsync(id, ct);
                if (rule == null) return false;

                var result = await _ruleRepository.DeleteAsync(id, ct);
                return result;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error deleting lead score rule {Id}", id);
                throw;
            }
        }

        #endregion
    }
}
