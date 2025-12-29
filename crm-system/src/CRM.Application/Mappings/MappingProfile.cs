using AutoMapper;
using CRMSys.Application.Constants;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Domain.Entities;

namespace CRMSys.Application.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // CRMCategory
            CreateMap<CRMCategoryRequestDto, CRMCategory>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            // ReferenceTypes -> EnumDto (for dropdowns/enums)
            CreateMap<ReferenceTypes, EnumDto>()
                .ForMember(dest => dest.Value, opt => opt.MapFrom(src => src.Id))
                .ForMember(dest => dest.Name, opt => opt.MapFrom(src => src.Name))
                .ForMember(dest => dest.Description, opt => opt.MapFrom(src => src.Description))
                .ForMember(dest => dest.SortOrder, opt => opt.MapFrom(src => src.SortOrder))
                .ForMember(dest => dest.Kind, opt => opt.MapFrom(src => src.Kind))
                .ForMember(dest => dest.ModelType, opt => opt.MapFrom(src => src.ModelType));

            CreateMap<CRMCategory, CRMCategoryRequestDto>();

            CreateMap<CRMCategory, CRMCategoryResponseDto>()
                .ForMember(dest => dest.ReferenceTypeName,
                    opt => opt.MapFrom(src => EnumHelper.GetDescription((ReferenceType)src.ReferenceType)))
                .ForMember(dest => dest.ParentName, opt => opt.Ignore());

            // Lead mappings
            CreateMap<CreateLeadRequest, Lead>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.TelephoneNo, opt => opt.MapFrom(src => src.TelephoneNo))
                .ForMember(dest => dest.Website, opt => opt.MapFrom(src => src.Website))
                .ForMember(dest => dest.PaymentTerms, opt => opt.MapFrom(src => src.PaymentTerms))
                .IgnoreAuditable();

            CreateMap<UpdateLeadRequest, CreateLeadRequest>();

            CreateMap<UpdateLeadRequest, Lead>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.TelephoneNo, opt => opt.MapFrom(src => src.TelephoneNo))
                .ForMember(dest => dest.Website, opt => opt.MapFrom(src => src.Website))
                .ForMember(dest => dest.PaymentTerms, opt => opt.MapFrom(src => src.PaymentTerms))
                .ForMember(dest => dest.Type, opt => opt.MapFrom(src => src.Type))
                .IgnoreAuditable();

            CreateMap<Lead, LeadResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
                .ForMember(dest => dest.TelephoneNo, opt => opt.MapFrom(src => src.TelephoneNo));

            // Lead address mappings
            CreateMap<CreateLeadAddressRequest, LeadAddress>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.LeadId, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<LeadAddressDto, LeadAddress>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.TelephoneNo, opt => opt.MapFrom(src => src.TelephoneNo));

            // LeadScoreRule mappings - simplified single-table design
            CreateMap<LeadScoreRule, LeadScoreRuleResponse>();
            CreateMap<CreateLeadScoreRuleRequest, LeadScoreRule>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<LeadAddress, LeadAddressDto>();

            // Customer mappings
            CreateMap<CreateCustomerRequest, Customer>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateCustomerRequest, Customer>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<Customer, CustomerResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // Customer address mappings
            CreateMap<CustomerAddressDto, CustomerAddress>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<CustomerAddress, CustomerAddressDto>();

            CreateMap<CreateCustomerAddressRequest, CustomerAddress>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateCustomerAddressRequest, CustomerAddress>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<CustomerAddress, CustomerAddressResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // Contact mappings
            CreateMap<CreateContactRequest, Contact>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateContactRequest, Contact>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<Contact, ContactResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // Deal mappings
            CreateMap<CreateDealRequest, Deal>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateDealRequest, CreateDealRequest>();

            CreateMap<UpdateDealRequest, Deal>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<Deal, DealResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // Activity mappings
            CreateMap<CreateActivityRequest, Activity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateActivityRequest, Activity>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateActivityRequest, CreateActivityRequest>();

            CreateMap<Activity, ActivityResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
                .ForMember(dest => dest.CreatedOnActivity, opt => opt.MapFrom(src => src.CreatedOn));

            // Goal mappings
            CreateMap<CreateGoalRequest, Goal>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OwnerUserId, opt => opt.MapFrom(src => src.OwnerType == "individual" ? src.OwnerId : null))
                .IgnoreAuditable();

            CreateMap<UpdateGoalRequest, Goal>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.OwnerUserId, opt => opt.MapFrom(src => src.OwnerType == "individual" ? src.OwnerId : null))
                .IgnoreAuditable();

            CreateMap<UpdateGoalRequest, CreateGoalRequest>();

            CreateMap<Goal, GoalResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy))
                .ForMember(dest => dest.ProgressPercentage, opt => opt.MapFrom(src => src.ProgressPercentage))
                .ForMember(dest => dest.IsOverdue, opt => opt.MapFrom(src => src.IsOverdue))
                .ForMember(dest => dest.OwnerTypeDisplay, opt => opt.MapFrom(src => src.OwnerTypeDisplay))
                .ForMember(dest => dest.StatusDisplay, opt => opt.MapFrom(src => src.StatusDisplay))
                .ForMember(dest => dest.TimeframeDisplay, opt => opt.MapFrom(src => src.TimeframeDisplay))
                .ForMember(dest => dest.TypeDisplay, opt => opt.MapFrom(src => src.TypeDisplay));

            // Email mappings
            CreateMap<CreateEmailRequest, Email>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.MailId, opt => opt.MapFrom(src => src.MailId))
                .IgnoreAuditable();

            CreateMap<UpdateEmailRequest, Email>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.MailId, opt => opt.MapFrom(src => src.MailId))
                .IgnoreAuditable();

            CreateMap<Email, EmailResponse>()
                .ForMember(dest => dest.MailId, opt => opt.MapFrom(src => src.MailId))
                .ForMember(dest => dest.CreatedDateTime, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.LastModifiedDateTime, opt => opt.MapFrom(src => src.UpdatedOn));

            // Appointment mappings
            CreateMap<CreateAppointmentRequest, Appointment>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateAppointmentRequest, Appointment>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateAppointmentRequest, CreateAppointmentRequest>();

            CreateMap<Appointment, AppointmentResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.LastModifiedDateTime, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn));

            // User mappings
            CreateMap<CreateUserRequest, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateUserRequest, User>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<User, UserResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // Quotation mappings
            CreateMap<CreateQuotationRequest, Quotation>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateQuotationRequest, Quotation>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<Quotation, QuotationResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // DealQuotation mappings
            CreateMap<CreateDealQuotationRequest, DealQuotation>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateDealQuotationRequest, DealQuotation>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<DealQuotation, DealQuotationResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));


            // Assignee mappings
            CreateMap<CreateAssigneeRequest, Assignee>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.AssignedAt, opt => opt.MapFrom(src => DateTime.UtcNow))
                .IgnoreAuditable();

            CreateMap<Assignee, AssigneeResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // PipelineLog mappings
            CreateMap<CreatePipelineLogRequest, PipelineLog>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.ChangedAt, opt => opt.MapFrom(src => src.ChangedAt ?? DateTime.UtcNow))
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => DateTime.UtcNow))
                .IgnoreAuditable();

            CreateMap<UpdatePipelineLogRequest, PipelineLog>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<PipelineLog, PipelineLogResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy));

            // ActivityParticipant mappings
            CreateMap<CreateActivityParticipantRequest, ActivityParticipant>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<ActivityParticipant, ActivityParticipantResponse>()
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // ActivityAttachment mappings
            CreateMap<CreateActivityAttachmentRequest, ActivityAttachment>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<ActivityAttachment, ActivityAttachmentResponse>()
                .ForMember(dest => dest.IdRef, opt => opt.MapFrom(src => src.IdRef))
                .ForMember(dest => dest.CreatedOn, opt => opt.MapFrom(src => src.CreatedOn))
                .ForMember(dest => dest.CreatedBy, opt => opt.MapFrom(src => src.CreatedBy))
                .ForMember(dest => dest.UpdatedOn, opt => opt.MapFrom(src => src.UpdatedOn))
                .ForMember(dest => dest.UpdatedBy, opt => opt.MapFrom(src => src.UpdatedBy));

            // Email Template mappings
            CreateMap<CreateEmailTemplateRequest, EmailTemplate>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UsageCount, opt => opt.Ignore())
                .ForMember(dest => dest.LastUsedAt, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<UpdateEmailTemplateRequest, EmailTemplate>()
                .ForMember(dest => dest.Id, opt => opt.Ignore())
                .ForMember(dest => dest.UsageCount, opt => opt.Ignore())
                .ForMember(dest => dest.LastUsedAt, opt => opt.Ignore())
                .ForMember(dest => dest.DeletedAt, opt => opt.Ignore())
                .IgnoreAuditable();

            CreateMap<EmailTemplate, EmailTemplateResponse>()
                .ForMember(dest => dest.CreatorEmail, opt => opt.MapFrom(src => src.CreatedBy != null ? src.CreatedBy : null))
                .ForMember(dest => dest.IsOwner, opt => opt.Ignore())
                .ForMember(dest => dest.CanEdit, opt => opt.Ignore())
                .ForMember(dest => dest.CanDelete, opt => opt.Ignore());

            CreateMap<EmailTemplateVariable, EmailTemplateVariableResponse>();
        }
    }

    // Extension d? ignore cc field audit chung
    public static class MappingExtensions
    {
        public static IMappingExpression<TSource, TDestination> IgnoreAuditable<TSource, TDestination>(
            this IMappingExpression<TSource, TDestination> map)
        {
            return map
                .ForMember("CreatedOn", opt => opt.Ignore())
                .ForMember("CreatedBy", opt => opt.Ignore())
                .ForMember("UpdatedOn", opt => opt.Ignore())
                .ForMember("UpdatedBy", opt => opt.Ignore());
        }
    }
}
