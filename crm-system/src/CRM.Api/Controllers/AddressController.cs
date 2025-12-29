using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using Shared.AuthN.Common;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for managing addresses (Lead and Customer addresses)
    /// </summary>
    [Authorize]
    [ApiController]
    [Route("api/addresses")]
    public class AddressController : ControllerBase
    {
        private readonly IAddressService _addressService;

        /// <summary>
        /// Init
        /// </summary>
        /// <param name="addressService"></param>
        public AddressController(IAddressService addressService)
        {
            _addressService = addressService;
        }

        /// <summary>
        /// Get addresses by relation (e.g., all addresses for a specific lead or customer)
        /// </summary>
        /// <param name="relationType">Loại relation (lead, customer, ...)</param>
        /// <param name="relationId">ID của relation</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of addresses của relation</returns>
        /// <response code="200">Successfully returned List of addresses</response>
        /// <response code="400">Invalid request</response>
        /// <response code="500">Server error while processing request</response>
        [HttpGet("by-relation")]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<AddressResponse>>), 200)]
        [ProducesResponseType(typeof(ApiResponse<string>), 400)]
        [ProducesResponseType(typeof(ApiResponse<string>), 500)]
        public async Task<IActionResult> GetByRelation(
            [FromQuery] string relationType,
            [FromQuery] long relationId,
            CancellationToken ct = default)
        {
            try
            {
                if (string.IsNullOrEmpty(relationType))
                    return BadRequest(ApiResponse<string>.Fail("Relation type is required"));

                if (relationId <= 0)
                    return BadRequest(ApiResponse<string>.Fail("Relation ID must be greater than 0"));

                Log.Information("GetByRelation - Getting addresses for {RelationType} {RelationId}",
                    relationType, relationId);

                var addresses = await _addressService.GetByRelationAsync(relationType, relationId, ct);

                Log.Information("GetByRelation - Retrieved {Count} addresses for {RelationType} {RelationId}",
                    addresses.Count(), relationType, relationId);

                return Ok(ApiResponse<IEnumerable<AddressResponse>>.Ok(
                    addresses,
                    $"Retrieved addresses for {relationType} {relationId} successfully"));
            }
            catch (Exception ex)
            {
                Log.Error(ex, "GetByRelation - Error retrieving addresses for {RelationType} {RelationId}",
                    relationType, relationId);
                return StatusCode(500, ApiResponse<string>.Fail(
                    $"An error occurred while retrieving addresses: {ex.Message}"));
            }
        }
    }
}
