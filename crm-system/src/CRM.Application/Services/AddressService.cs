using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Address service implementation
    /// </summary>
    public class AddressService : IAddressService
    {
        private readonly IAddressRepository _addressRepository;

        public AddressService(IAddressRepository addressRepository)
        {
            _addressRepository = addressRepository;
        }

        /// <summary>
        /// Get addresses by relation (e.g., all addresses for a specific lead or customer)
        /// </summary>
        public async Task<IEnumerable<AddressResponse>> GetByRelationAsync(string relationType, long relationId, CancellationToken ct = default)
        {
            return await _addressRepository.GetByRelationAsync(relationType, relationId, ct);
        }
    }
}
