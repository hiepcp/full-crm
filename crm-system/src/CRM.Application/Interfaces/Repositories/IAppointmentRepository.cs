using CRMSys.Application.Dtos.Request;
using CRMSys.Domain.Entities;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Repositories
{
    public interface IAppointmentRepository
    {
        Task<PagedResult<Appointment>> QueryAsync(AppointmentQueryRequest query, CancellationToken ct = default);
        Task<Appointment?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<Appointment?> GetByMailIdAsync(string mailId, CancellationToken ct = default);
        Task<long> CreateAsync(Appointment appointment, CancellationToken ct = default);
        Task<bool> UpdateAsync(Appointment appointment, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, CancellationToken ct = default);
        Task<bool> ExistsAsync(long id, CancellationToken ct = default);
    }
}



