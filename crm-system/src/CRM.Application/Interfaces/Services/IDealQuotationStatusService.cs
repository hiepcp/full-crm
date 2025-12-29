using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace CRMSys.Application.Interfaces.Services
{
    /// <summary>
    /// Service interface for managing deal pipeline logic based on Dynamics 365 quotation statuses
    /// </summary>
    public interface IDealQuotationStatusService
    {
        /// <summary>
        /// Evaluate and update deal stage based on quotation statuses from Dynamics 365
        /// </summary>
        /// <param name="dealId">The deal ID to evaluate</param>
        /// <param name="userEmail">Email of the user triggering the evaluation</param>
        /// <param name="ct">Cancellation token</param>
        Task EvaluateAndUpdateDealStageAsync(long dealId, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Get quotation statuses from Dynamics 365 for given quotation numbers
        /// </summary>
        /// <param name="quotationNumbers">List of quotation numbers to query</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of quotation statuses</returns>
        Task<List<string>> GetQuotationStatusesFromDynamicsAsync(IEnumerable<string> quotationNumbers, CancellationToken ct = default);

        /// <summary>
        /// Trigger pipeline update when quotation status changes in Dynamics 365
        /// </summary>
        /// <param name="quotationNumber">The quotation number that changed</param>
        /// <param name="oldStatus">Previous status</param>
        /// <param name="newStatus">New status</param>
        /// <param name="userEmail">Email of the user/system triggering the update</param>
        /// <param name="ct">Cancellation token</param>
        Task TriggerPipelineUpdateAsync(string quotationNumber, string oldStatus, string newStatus, string userEmail, CancellationToken ct = default);

        /// <summary>
        /// Get all quotation numbers associated with a deal
        /// </summary>
        /// <param name="dealId">The deal ID</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>List of quotation numbers</returns>
        Task<List<string>> GetQuotationNumbersByDealIdAsync(long dealId, CancellationToken ct = default);
    }
}