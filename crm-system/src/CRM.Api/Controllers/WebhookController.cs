using CRMSys.Application.Interfaces.Services;
using Microsoft.AspNetCore.Mvc;
using Serilog;
using System.Threading;
using System.Threading.Tasks;

namespace CRMSys.Api.Controllers
{
    /// <summary>
    /// Controller for handling webhooks from external systems (Dynamics 365, etc.)
    /// </summary>
    [ApiController]
    [Route("api/webhooks")]
    public class WebhookController : ControllerBase
    {
        private readonly IDealQuotationStatusService _dealQuotationStatusService;

        /// <summary>
        /// Init WebhookController
        /// </summary>
        /// <param name="dealQuotationStatusService"></param>
        public WebhookController(IDealQuotationStatusService dealQuotationStatusService)
        {
            _dealQuotationStatusService = dealQuotationStatusService;
        }

        /// <summary>
        /// Handle quotation status change webhook from Dynamics 365
        /// </summary>
        /// <param name="webhook">Quotation status change data</param>
        /// <param name="ct">Cancellation token</param>
        /// <returns>Success response</returns>
        [HttpPost("dynamics/quotation-status-changed")]
        [ProducesResponseType(typeof(string), 200)]
        [ProducesResponseType(typeof(string), 400)]
        [ProducesResponseType(typeof(string), 500)]
        public async Task<IActionResult> OnQuotationStatusChanged([FromBody] QuotationStatusWebhook webhook, CancellationToken ct = default)
        {
            try
            {
                if (webhook == null || string.IsNullOrEmpty(webhook.QuotationNumber))
                {
                    return BadRequest("Invalid webhook data");
                }

                Log.Information("Received quotation status webhook: {QuotationNumber} changed from {OldStatus} to {NewStatus}",
                    webhook.QuotationNumber, webhook.OldStatus, webhook.NewStatus);

                await _dealQuotationStatusService.TriggerPipelineUpdateAsync(
                    webhook.QuotationNumber,
                    webhook.OldStatus,
                    webhook.NewStatus,
                    "dynamics-webhook",
                    ct
                );

                return Ok("Webhook processed successfully");
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error processing quotation status webhook for {QuotationNumber}",
                    webhook?.QuotationNumber);
                return StatusCode(500, $"Error processing webhook: {ex.Message}");
            }
        }
    }

    /// <summary>
    /// Webhook data model for quotation status changes
    /// </summary>
    public class QuotationStatusWebhook
    {
        /// <summary>
        /// The quotation number that changed
        /// </summary>
        public string? QuotationNumber { get; set; }

        /// <summary>
        /// Previous status
        /// </summary>
        public string? OldStatus { get; set; }

        /// <summary>
        /// New status
        /// </summary>
        public string? NewStatus { get; set; }

        /// <summary>
        /// Timestamp of the change
        /// </summary>
        public DateTime? ChangedAt { get; set; }
    }
}