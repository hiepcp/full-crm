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
    public class AppointmentService : BaseService<Appointment, long, CreateAppointmentRequest>, IAppointmentService
    {
        private readonly IAppointmentRepository _appointmentRepository;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateAppointmentRequest> _createValidator;
        private readonly IValidator<UpdateAppointmentRequest> _updateValidator;

        public AppointmentService(
            IRepository<Appointment, long> repository,
            IUnitOfWork unitOfWork,
            IMapper mapper,
            IValidator<CreateAppointmentRequest> createValidator,
            IValidator<UpdateAppointmentRequest> updateValidator,
            IAppointmentRepository appointmentRepository)
            : base(repository, unitOfWork, mapper, createValidator)
        {
            _appointmentRepository = appointmentRepository;
            _mapper = mapper;
            _createValidator = createValidator;
            _updateValidator = updateValidator;
        }

        public async Task<PagedResult<AppointmentResponse>> QueryAsync(AppointmentQueryRequest request, CancellationToken ct = default)
        {
            var result = await _appointmentRepository.QueryAsync(request, ct);
            var responseItems = _mapper.Map<List<AppointmentResponse>>(result.Items);

            return new PagedResult<AppointmentResponse>
            {
                Items = responseItems,
                TotalCount = result.TotalCount
            };
        }

        public new async Task<AppointmentResponse?> GetByIdAsync(long id, CancellationToken ct = default)
        {
            var appointment = await base.GetByIdAsync(id, ct);
            return appointment == null ? null : _mapper.Map<AppointmentResponse>(appointment);
        }

        public async Task<AppointmentResponse?> GetByMailIdAsync(string mailId, CancellationToken ct = default)
        {
            var appointment = await _appointmentRepository.GetByMailIdAsync(mailId, ct);
            return appointment == null ? null : _mapper.Map<AppointmentResponse>(appointment);
        }

        public async Task<long> CreateAsync(CreateAppointmentRequest request, string userEmail, CancellationToken ct = default)
        {
            await _createValidator.ValidateAndThrowAsync(request, ct);
            return await base.AddAsync(request, userEmail, ct);
        }

        public async Task<bool> UpdateAsync(long id, UpdateAppointmentRequest request, string userEmail, CancellationToken ct = default)
        {
            var validation = await _updateValidator.ValidateAsync(request, ct);
            if (!validation.IsValid)
            {
                throw new ValidationException(validation.Errors);
            }

            var mapped = _mapper.Map<CreateAppointmentRequest>(request);
            // Start transaction for the update operation

            try
            {
                await base.UpdateAsync(id, mapped, userEmail, ct);
                return true;
            }
            catch (KeyNotFoundException)
            {
                return false;
            }
            catch
            {
                throw;
            }
        }

        public new async Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default)
        {
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
    }
}


