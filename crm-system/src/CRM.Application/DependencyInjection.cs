using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Interfaces;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Application.Mappings;
using CRMSys.Application.Services;
using CRMSys.Application.Utils;
using CRMSys.Application.Validators;
using CRMSys.Domain.Entities;
using FluentValidation;
using Microsoft.Extensions.DependencyInjection;
using Shared.ExternalServices.Interfaces;
using Shared.ExternalServices.Services;
using Shared.ExternalServices.Utilities;

namespace CRMSys.Application
    
{
        public static class DependencyInjection
        {
            public static IServiceCollection AddApplication(this IServiceCollection services)
            {
                services.AddSingleton<ICacheHelper, CacheHelper>();
                // ang k AutoMapper dng overload, ch? truy?n vo assembly ch?a profile
                services.AddAutoMapper(typeof(MappingProfile).Assembly);

                // ang k generic service
                services.AddScoped(typeof(IBaseService<,,>), typeof(BaseService<,,>));

                // ang k Dynamics 365 services
                services.AddTransient<IDynamicService, DynamicService>();
                services.AddTransient<DynamicsParameterManager>();

                // ang k SharePoint services
                services.AddScoped<ISharepointService, SharepointService>();

                // ang k t?ng service c? th?
                services.AddScoped<ICRMCategoryService, CRMCategoryService>();
                services.AddScoped<ILeadService, LeadService>();
                services.AddScoped<ICRMSharepointFileService, CRMSharepointFileService>();

            // Register new CRM services
                services.AddScoped<IReferenceTypesService, ReferenceTypesService>();
                services.AddScoped<ICustomerService, CustomerService>();
                services.AddScoped<ICustomerAddressService, CustomerAddressService>();
                services.AddScoped<IContactService, ContactService>();
                services.AddScoped<IDealService, DealService>();
                services.AddScoped<IActivityService, ActivityService>();
                services.AddScoped<IEmailService, EmailService>();
                services.AddScoped<IAppointmentService, AppointmentService>();
                services.AddScoped<ICRMDynamicsService, CRMDynamicsService>();
                services.AddScoped<IUserService, UserService>();
                services.AddScoped<IQuotationService, QuotationService>();
                services.AddScoped<IDealQuotationService, DealQuotationService>();
                services.AddScoped<IDealQuotationStatusService, DealQuotationStatusService>();
                services.AddScoped<IAssigneeService, AssigneeService>();
                services.AddScoped<IPipelineLogService, PipelineLogService>();
                services.AddScoped<IActivityParticipantService, ActivityParticipantService>();
                services.AddScoped<IActivityAttachmentService, ActivityAttachmentService>();
                // Register new CRM services
                services.AddScoped<ICustomerService, CustomerService>();
                services.AddScoped<IContactService, ContactService>();
                services.AddScoped<IDealService, DealService>();
                services.AddScoped<IActivityService, ActivityService>();
                services.AddScoped<IEmailService, EmailService>();
                services.AddScoped<IUserService, UserService>();
                services.AddScoped<IQuotationService, QuotationService>();
                services.AddScoped<IAssigneeService, AssigneeService>();
                services.AddScoped<IPipelineLogService, PipelineLogService>();
                services.AddScoped<IActivityParticipantService, ActivityParticipantService>();
                services.AddScoped<IActivityAttachmentService, ActivityAttachmentService>();
                services.AddScoped<IAddressService, AddressService>();
                services.AddScoped<ICRMUploadService, CRMUploadService>();
                services.AddScoped<IFileRetrievalService, FileRetrievalService>();
                services.AddScoped<IGoalService, GoalService>();
                services.AddScoped<IGoalProgressCalculationService, GoalProgressCalculationService>();
                services.AddScoped<IGoalHierarchyService, GoalHierarchyService>();
                services.AddScoped<IEmailTemplateService, EmailTemplateService>();
                services.AddScoped<IAppointmentService, AppointmentService>();
                services.AddScoped<ILeadScoreService, LeadScoreService>();

                // Notification service
                services.AddScoped<INotificationService, NotificationService>();

                services.AddScoped<IAllCRMService, AllCRMService>();
                services.AddScoped<DynamicModelService>();

                // Register all required validators
                services.AddScoped<IValidator<CRMCategoryRequestDto>, CRMCategoryRequestDtoValidator>();
                services.AddScoped<IValidator<CreateLeadRequest>, CreateLeadRequestValidator>();
                services.AddScoped<IValidator<UpdateLeadRequest>, UpdateLeadRequestValidator>();
                services.AddScoped<IValidator<CreateLeadAddressRequest>, CreateLeadAddressRequestValidator>();
                services.AddScoped<IValidator<LeadQueryRequest>, LeadQueryRequestValidator>();
                services.AddScoped<IValidator<CRMSharepointFile>, CRMSharepointFileValidator>();

            // Register new validators
                services.AddScoped<IValidator<ReferenceTypesRequestDto>, ReferenceTypesRequestDtoValidator>();
                services.AddScoped<IValidator<CustomerQueryRequest>, CustomerQueryRequestValidator>();
                services.AddScoped<IValidator<CreateCustomerRequest>, CreateCustomerRequestValidator>();
                services.AddScoped<IValidator<UpdateCustomerRequest>, UpdateCustomerRequestValidator>();
                services.AddScoped<IValidator<CustomerAddressQueryRequest>, CustomerAddressQueryRequestValidator>();
                services.AddScoped<IValidator<CreateCustomerAddressRequest>, CreateCustomerAddressRequestValidator>();
                services.AddScoped<IValidator<UpdateCustomerAddressRequest>, UpdateCustomerAddressRequestValidator>();
                services.AddScoped<IValidator<ContactQueryRequest>, ContactQueryRequestValidator>();
                services.AddScoped<IValidator<CreateContactRequest>, CreateContactRequestValidator>();
                services.AddScoped<IValidator<UpdateContactRequest>, UpdateContactRequestValidator>();
                services.AddScoped<IValidator<DealQueryRequest>, DealQueryRequestValidator>();
                services.AddScoped<IValidator<CreateDealRequest>, CreateDealRequestValidator>();
                services.AddScoped<IValidator<UpdateDealRequest>, UpdateDealRequestValidator>();
                services.AddScoped<IValidator<ActivityQueryRequest>, ActivityQueryRequestValidator>();
                services.AddScoped<IValidator<CreateActivityRequest>, CreateActivityRequestValidator>();
                services.AddScoped<IValidator<UpdateActivityRequest>, UpdateActivityRequestValidator>();
                services.AddScoped<IValidator<EmailQueryRequest>, EmailQueryRequestValidator>();
                services.AddScoped<IValidator<CreateEmailRequest>, CreateEmailRequestValidator>();
                services.AddScoped<IValidator<UpdateEmailRequest>, UpdateEmailRequestValidator>();
                services.AddScoped<IValidator<AppointmentQueryRequest>, AppointmentQueryRequestValidator>();
                services.AddScoped<IValidator<CreateAppointmentRequest>, CreateAppointmentRequestValidator>();
                services.AddScoped<IValidator<UpdateAppointmentRequest>, UpdateAppointmentRequestValidator>();
                services.AddScoped<IValidator<UserQueryRequest>, UserQueryRequestValidator>();
                services.AddScoped<IValidator<CreateUserRequest>, CreateUserRequestValidator>();
                services.AddScoped<IValidator<UpdateUserRequest>, UpdateUserRequestValidator>();
                services.AddScoped<IValidator<QuotationQueryRequest>, QuotationQueryRequestValidator>();
                services.AddScoped<IValidator<CreateQuotationRequest>, CreateQuotationRequestValidator>();
                services.AddScoped<IValidator<UpdateQuotationRequest>, UpdateQuotationRequestValidator>();
                services.AddScoped<IValidator<DealQuotationQueryRequest>, DealQuotationQueryRequestValidator>();
                services.AddScoped<IValidator<CreateDealQuotationRequest>, CreateDealQuotationRequestValidator>();
                services.AddScoped<IValidator<UpdateDealQuotationRequest>, UpdateDealQuotationRequestValidator>();
                services.AddScoped<IValidator<AssigneeQueryRequest>, AssigneeQueryRequestValidator>();
                services.AddScoped<IValidator<CreateAssigneeRequest>, CreateAssigneeRequestValidator>();
                services.AddScoped<IValidator<UpdateAssigneeRequest>, UpdateAssigneeRequestValidator>();
                services.AddScoped<IValidator<PipelineLogQueryRequest>, PipelineLogQueryRequestValidator>();
                services.AddScoped<IValidator<CreatePipelineLogRequest>, CreatePipelineLogRequestValidator>();
                services.AddScoped<IValidator<UpdatePipelineLogRequest>, UpdatePipelineLogRequestValidator>();
                services.AddScoped<IValidator<ActivityParticipantQueryRequest>, ActivityParticipantQueryRequestValidator>();
                services.AddScoped<IValidator<CreateActivityParticipantRequest>, CreateActivityParticipantRequestValidator>();
                services.AddScoped<IValidator<UpdateActivityParticipantRequest>, UpdateActivityParticipantRequestValidator>();
                services.AddScoped<IValidator<ActivityAttachmentQueryRequest>, ActivityAttachmentQueryRequestValidator>();
                services.AddScoped<IValidator<CreateActivityAttachmentRequest>, CreateActivityAttachmentRequestValidator>();
                services.AddScoped<IValidator<UpdateActivityAttachmentRequest>, UpdateActivityAttachmentRequestValidator>();
                services.AddScoped<IValidator<GoalQueryRequest>, GoalQueryRequestValidator>();
                services.AddScoped<IValidator<CreateGoalRequest>, CreateGoalRequestValidator>();
                services.AddScoped<IValidator<UpdateGoalRequest>, UpdateGoalRequestValidator>();
                services.AddScoped<IValidator<GoalMetricsRequest>, GoalMetricsRequestValidator>();
                services.AddScoped<IValidator<CreateEmailTemplateRequest>, CreateEmailTemplateRequestValidator>();
                services.AddScoped<IValidator<UpdateEmailTemplateRequest>, UpdateEmailTemplateRequestValidator>();
                services.AddScoped<IValidator<ManualProgressAdjustmentRequest>, ManualProgressAdjustmentRequestValidator>();

                return services;
            }
        }
}
