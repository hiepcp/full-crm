using CRMSys.Application.Dtos.Response;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service interface for Address business logic operations
    /// </summary>
    public interface IAddressService
    {
        /// <summary>
        /// Get addresses by relation (e.g., all addresses for a specific lead or customer)
        /// </summary>
        Task<IEnumerable<AddressResponse>> GetByRelationAsync(string relationType, long relationId, CancellationToken ct = default);
    }
}
