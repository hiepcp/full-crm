using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Repositories
{
    /// <summary>
    /// Repository interface for Address data access operations
    /// </summary>
    public interface IAddressRepository
    {
        /// <summary>
        /// Get addresses by relation (e.g., all addresses for a specific lead or customer)
        /// </summary>
        Task<IEnumerable<AddressResponse>> GetByRelationAsync(string relationType, long relationId, CancellationToken ct = default);
    }
}
