using CRMSys.Domain.Entities;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for lead addresses
    /// </summary>
    public interface ILeadAddressRepository
    {
        Task<IEnumerable<LeadAddress>> GetByLeadIdAsync(long leadId, CancellationToken ct = default);
        Task BulkInsertAsync(IEnumerable<LeadAddress> addresses, CancellationToken ct = default);
        Task<long> CreateAsync(LeadAddress address, CancellationToken ct = default);
        Task UpdateAsync(LeadAddress address, CancellationToken ct = default);
        Task BulkUpdateAsync(IEnumerable<LeadAddress> addresses, CancellationToken ct = default);
        Task DeleteByIdsAsync(IEnumerable<long> ids, CancellationToken ct = default);
    }
}

