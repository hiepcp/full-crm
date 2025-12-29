using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using Shared.Dapper.Interfaces;
using System.Text.RegularExpressions;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Email Template service implementation with business logic
    /// </summary>
    public class EmailTemplateService : IEmailTemplateService
    {
        private readonly IEmailTemplateRepository _repository;
        private readonly IEmailTemplateVariableRepository _variableRepository;
        private readonly IUserRepository _userRepository;
        private readonly ILeadRepository _leadRepository;
        private readonly IDealRepository _dealRepository;
        private readonly IContactRepository _contactRepository;
        private readonly ICustomerRepository _customerRepository;
        private readonly IUnitOfWork _unitOfWork;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateEmailTemplateRequest> _createValidator;
        private readonly IValidator<UpdateEmailTemplateRequest> _updateValidator;

        public EmailTemplateService(
            IEmailTemplateRepository repository,
            IEmailTemplateVariableRepository variableRepository,
            IUserRepository userRepository,
            ILeadRepository leadRepository,
            IDealRepository dealRepository,
            IContactRepository contactRepository,
            ICustomerRepository customerRepository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateEmailTemplateRequest> createValidator,
            IValidator<UpdateEmailTemplateRequest> updateValidator)
        {
            _repository = repository;
            _variableRepository = variableRepository;
            _userRepository = userRepository;
            _leadRepository = leadRepository;
            _dealRepository = dealRepository;
            _contactRepository = contactRepository;
            _customerRepository = customerRepository;
            _unitOfWork = unitOfWork;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        /// <summary>
        /// Get available templates for user
        /// </summary>
        public async Task<IEnumerable<EmailTemplateResponse>> GetAvailableTemplatesAsync(string userEmail, CancellationToken ct = default)
        {
            var templates = await _repository.GetAvailableTemplatesForUserAsync(userEmail, ct);
            var responses = new List<EmailTemplateResponse>();

            foreach (var template in templates)
            {
                var response = _mapper.Map<EmailTemplateResponse>(template);
                response.IsOwner = template.IsOwnedBy(userEmail);
                response.CanEdit = template.CanBeEditedBy(userEmail);
                response.CanDelete = template.CanBeDeletedBy(userEmail);
                responses.Add(response);
            }

            return responses;
        }

        /// <summary>
        /// Get template by ID
        /// </summary>
        public async Task<EmailTemplateResponse?> GetByIdAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var template = await _repository.GetByIdAsync(id, ct);
            if (template == null) return null;

            var response = _mapper.Map<EmailTemplateResponse>(template);
            response.IsOwner = template.IsOwnedBy(userEmail);
            response.CanEdit = template.CanBeEditedBy(userEmail);
            response.CanDelete = template.CanBeDeletedBy(userEmail);
            response.CreatorEmail = template.CreatedBy;

            return response;
        }

        /// <summary>
        /// Create new template
        /// </summary>
        public async Task<long> CreateAsync(CreateEmailTemplateRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate
            await _createValidator.ValidateAndThrowAsync(request, ct);

            // Map to entity
            var template = _mapper.Map<EmailTemplate>(request);
            template.CreatedOn = DateTime.UtcNow;
            template.CreatedBy = userEmail;
            template.UpdatedOn = DateTime.UtcNow;
            template.UpdatedBy = userEmail;

            // Save
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var id = await _repository.CreateAsync(template, ct);
                await _unitOfWork.CommitAsync();
                return id;
            }
            catch
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Update template
        /// </summary>
        public async Task<bool> UpdateAsync(long id, UpdateEmailTemplateRequest request, string userEmail, CancellationToken ct = default)
        {
            // Validate
            await _updateValidator.ValidateAndThrowAsync(request, ct);

            // Get existing template
            var existing = await _repository.GetByIdAsync(id, ct);
            if (existing == null) return false;

            // Check permissions
            if (!existing.CanBeEditedBy(userEmail))
                throw new UnauthorizedAccessException("You don't have permission to edit this template");

            // Map updates
            _mapper.Map(request, existing);
            existing.UpdatedOn = DateTime.UtcNow;
            existing.UpdatedBy = userEmail;

            // Save
            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var updated = await _repository.UpdateAsync(existing, ct);
                await _unitOfWork.CommitAsync();
                return updated;
            }
            catch
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Delete template
        /// </summary>
        public async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
            var template = await _repository.GetByIdAsync(id, ct);
            if (template == null) return false;

            if (!template.CanBeDeletedBy(userEmail))
                throw new UnauthorizedAccessException("You don't have permission to delete this template");

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                var deleted = await _repository.SoftDeleteAsync(id, ct);
                await _unitOfWork.CommitAsync();
                return deleted;
            }
            catch
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Search templates
        /// </summary>
        public async Task<IEnumerable<EmailTemplateResponse>> SearchAsync(string userEmail, string keyword, string? category = null, CancellationToken ct = default)
        {
            var templates = await _repository.SearchAsync(userEmail, keyword, category, ct);
            var responses = new List<EmailTemplateResponse>();

            foreach (var template in templates)
            {
                var response = _mapper.Map<EmailTemplateResponse>(template);
                response.IsOwner = template.IsOwnedBy(userEmail);
                response.CanEdit = template.CanBeEditedBy(userEmail);
                response.CanDelete = template.CanBeDeletedBy(userEmail);
                response.CreatorEmail = template.CreatedBy;
                responses.Add(response);
            }

            return responses;
        }

        /// <summary>
        /// Get templates by category
        /// </summary>
        public async Task<IEnumerable<EmailTemplateResponse>> GetByCategoryAsync(string userEmail, string category, CancellationToken ct = default)
        {
            var templates = await _repository.GetByCategoryAsync(userEmail, category, ct);
            return templates.Select(t =>
            {
                var response = _mapper.Map<EmailTemplateResponse>(t);
                response.IsOwner = t.IsOwnedBy(userEmail);
                response.CanEdit = t.CanBeEditedBy(userEmail);
                response.CanDelete = t.CanBeDeletedBy(userEmail);
                response.CreatorEmail = t.CreatedBy;
                return response;
            });
        }

        /// <summary>
        /// Get user's own templates
        /// </summary>
        public async Task<IEnumerable<EmailTemplateResponse>> GetUserTemplatesAsync(string userEmail, CancellationToken ct = default)
        {
            var templates = await _repository.GetUserTemplatesAsync(userEmail, ct);
            return templates.Select(t =>
            {
                var response = _mapper.Map<EmailTemplateResponse>(t);
                response.IsOwner = true;
                response.CanEdit = true;
                response.CanDelete = true;
                response.CreatorEmail = t.CreatedBy;
                return response;
            });
        }

        /// <summary>
        /// Get shared templates
        /// </summary>
        public async Task<IEnumerable<EmailTemplateResponse>> GetSharedTemplatesAsync(string userEmail, CancellationToken ct = default)
        {
            var templates = await _repository.GetSharedTemplatesAsync(userEmail, ct);
            return templates.Select(t =>
            {
                var response = _mapper.Map<EmailTemplateResponse>(t);
                response.IsOwner = false;
                response.CanEdit = true; // Shared templates can be edited by anyone
                response.CanDelete = false; // But not deleted
                response.CreatorEmail = t.CreatedBy;
                return response;
            });
        }

        /// <summary>
        /// Render template with variable replacement
        /// </summary>
        public async Task<RenderedEmailTemplateResponse> RenderTemplateAsync(RenderEmailTemplateRequest request, string userEmail, CancellationToken ct = default)
        {
            var template = await _repository.GetByIdAsync(request.TemplateId, ct);
            if (template == null)
                throw new KeyNotFoundException($"Template {request.TemplateId} not found");

            // Get variable values
            var variableValues = await GetVariableValuesAsync(request.EntityType, request.EntityId, userEmail, ct);

            // Merge with provided values (provided values override)
            if (request.VariableValues != null)
            {
                foreach (var kvp in request.VariableValues)
                {
                    variableValues[kvp.Key] = kvp.Value;
                }
            }

            // Replace variables in subject and body
            var renderedSubject = ReplaceVariables(template.Subject, variableValues);
            var renderedBody = ReplaceVariables(template.Body, variableValues);

            return new RenderedEmailTemplateResponse
            {
                TemplateId = template.Id,
                Name = template.Name,
                Subject = renderedSubject,
                Body = renderedBody
            };
        }

        /// <summary>
        /// Use template (send email)
        /// </summary>
        public async Task<bool> UseTemplateAsync(UseEmailTemplateRequest request, string userEmail, CancellationToken ct = default)
        {
            // Render template
            var rendered = await RenderTemplateAsync(new RenderEmailTemplateRequest
            {
                TemplateId = request.TemplateId,
                EntityType = request.EntityType,
                EntityId = request.EntityId,
                VariableValues = request.VariableValues
            }, userEmail, ct);

            // TODO: Send email using email service (SMTP, SendGrid, etc.)

            await _unitOfWork.BeginTransactionAsync();
            try
            {
                // Update template usage count
                await _repository.MarkAsUsedAsync(request.TemplateId, ct);

                await _unitOfWork.CommitAsync();
                return true;
            }
            catch
            {
                await _unitOfWork.RollbackAsync();
                throw;
            }
        }

        /// <summary>
        /// Get all available variables
        /// </summary>
        public async Task<IEnumerable<GroupedVariablesResponse>> GetAvailableVariablesAsync(CancellationToken ct = default)
        {
            var grouped = await _variableRepository.GetGroupedByEntityTypeAsync(ct);
            return grouped.Select(g => new GroupedVariablesResponse
            {
                EntityType = g.Key,
                Variables = _mapper.Map<List<EmailTemplateVariableResponse>>(g.Value)
            });
        }

        /// <summary>
        /// Get variable values from entities
        /// </summary>
        private async Task<Dictionary<string, string>> GetVariableValuesAsync(string? entityType, long? entityId, string userEmail, CancellationToken ct = default)
        {
            var values = new Dictionary<string, string>();

            // Always get current user variables
            var user = await _userRepository.GetByEmailAsync(userEmail, ct);
            if (user != null)
            {
                values["{{user_name}}"] = user.FullName;
                values["{{user_firstname}}"] = user.FirstName ?? "";
                values["{{user_lastname}}"] = user.LastName ?? "";
                values["{{user_email}}"] = user.Email;
                values["{{user_role}}"] = user.Role ?? "";
            }

            // Get entity-specific variables
            if (!string.IsNullOrEmpty(entityType) && entityId.HasValue)
            {
                switch (entityType.ToLower())
                {
                    case "lead":
                        var lead = await _leadRepository.GetByIdAsync(entityId.Value, ct);
                        if (lead != null)
                        {
                            values["{{lead_name}}"] = $"{lead.FirstName} {lead.LastName}".Trim();
                            values["{{lead_firstname}}"] = lead.FirstName ?? "";
                            values["{{lead_lastname}}"] = lead.LastName ?? "";
                            values["{{lead_email}}"] = lead.Email ?? "";
                            values["{{lead_phone}}"] = lead.TelephoneNo ?? "";
                            values["{{lead_company}}"] = lead.Company ?? "";
                            values["{{lead_source}}"] = lead.Source?.ToString() ?? "";
                        }
                        break;

                    case "deal":
                        var deal = await _dealRepository.GetByIdAsync(entityId.Value, ct);
                        if (deal != null)
                        {
                            //values["{{deal_name}}"] = deal.Title ?? "";
                            //values["{{deal_value}}"] = deal.EstimatedRevenue?.ToString("N0") ?? "";
                            values["{{deal_stage}}"] = deal.Stage ?? "";
                            values["{{deal_probability}}"] = deal.Probability.ToString() + "%" ?? "";

                            // Get related contact if exists
                            if (deal.ContactId.HasValue)
                            {
                                var contact = await _contactRepository.GetByIdAsync(deal.ContactId.Value, ct);
                                if (contact != null)
                                {
                                    values["{{contact_name}}"] = $"{contact.FirstName} {contact.MiddleName} {contact.LastName}".Trim();
                                    values["{{contact_firstname}}"] = contact.FirstName ?? "";
                                    values["{{contact_lastname}}"] = contact.LastName ?? "";
                                    values["{{contact_email}}"] = contact.Email ?? "";
                                    values["{{contact_phone}}"] = contact.Phone ?? "";
                                    values["{{contact_position}}"] = contact.JobTitle ?? "";
                                }
                            }

                            // Get related customer if exists
                            if (deal.CustomerId.HasValue)
                            {
                                var customer = await _customerRepository.GetByIdAsync(deal.CustomerId.Value, ct);
                                if (customer != null)
                                {
                                    values["{{customer_name}}"] = customer.Name ?? "";
                                    values["{{customer_email}}"] = customer.Email ?? "";
                                    values["{{customer_phone}}"] = customer.Phone ?? "";
                                    values["{{customer_country}}"] = customer.Country ?? "";
                                }
                            }
                        }
                        break;

                    case "contact":
                        var contactOnly = await _contactRepository.GetByIdAsync(entityId.Value, ct);
                        if (contactOnly != null)
                        {
                            values["{{contact_name}}"] = $"{contactOnly.FirstName} {contactOnly.MiddleName} {contactOnly.LastName}".Trim();
                            values["{{contact_firstname}}"] = contactOnly.FirstName ?? "";
                            values["{{contact_lastname}}"] = contactOnly.LastName ?? "";
                            values["{{contact_email}}"] = contactOnly.Email ?? "";
                            values["{{contact_phone}}"] = contactOnly.Phone ?? "";
                            values["{{contact_position}}"] = contactOnly.JobTitle ?? "";

                            // Get related customer
                            if (contactOnly.CustomerId.HasValue)
                            {
                                var customer = await _customerRepository.GetByIdAsync(contactOnly.CustomerId.Value, ct);
                                if (customer != null)
                                {
                                    values["{{customer_name}}"] = customer.Name ?? "";
                                    values["{{customer_email}}"] = customer.Email ?? "";
                                    values["{{customer_phone}}"] = customer.Phone ?? "";
                                    values["{{customer_country}}"] = customer.Country ?? "";
                                }
                            }
                        }
                        break;

                    case "customer":
                        var customerOnly = await _customerRepository.GetByIdAsync(entityId.Value, ct);
                        if (customerOnly != null)
                        {
                            values["{{customer_name}}"] = customerOnly.Name ?? "";
                            values["{{customer_email}}"] = customerOnly.Email ?? "";
                            values["{{customer_phone}}"] = customerOnly.Phone ?? "";
                            values["{{customer_country}}"] = customerOnly.Country ?? "";
                        }
                        break;
                }
            }

            // Add system variables
            values["{{company_name}}"] = "CoreOne CRM";
            values["{{company_email}}"] = "info@coreone.dk";
            values["{{company_phone}}"] = "+45 12 34 56 78";
            values["{{current_date}}"] = DateTime.Now.ToString("dd/MM/yyyy");
            values["{{current_time}}"] = DateTime.Now.ToString("HH:mm");

            return values;
        }

        /// <summary>
        /// Replace variables in text
        /// </summary>
        private string ReplaceVariables(string text, Dictionary<string, string> values)
        {
            if (string.IsNullOrEmpty(text)) return text;

            foreach (var kvp in values)
            {
                text = text.Replace(kvp.Key, kvp.Value);
            }

            // Remove any remaining unreplaced variables
            text = Regex.Replace(text, @"\{\{[^}]+\}\}", "");

            return text;
        }
    }
}
