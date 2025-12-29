using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using Shared.Dapper.Models;

namespace CRMSys.Application.Interfaces.Services
{
    public interface IEmailService
    {
        Task<PagedResult<EmailResponse>> QueryAsync(EmailQueryRequest request, CancellationToken ct = default);
        Task<EmailResponse?> GetByIdAsync(long id, CancellationToken ct = default);
        Task<long> CreateAsync(CreateEmailRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> UpdateAsync(long id, UpdateEmailRequest request, string userEmail, CancellationToken ct = default);
        Task<bool> DeleteAsync(long id, string userEmail, CancellationToken ct = default);
    }
}
