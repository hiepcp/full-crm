using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IAppointmentService
    {
        Task<PagedResult<AppointmentResponse>> QueryAsync(AppointmentQueryRequest request, CancellationToken ct = default);
        Task<AppointmentResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<AppointmentResponse?> GetByMailIdAsync(string mailId, CancellationToken ct = default);
        Task<long> CreateAsync(CreateAppointmentRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateAppointmentRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
    }
}



