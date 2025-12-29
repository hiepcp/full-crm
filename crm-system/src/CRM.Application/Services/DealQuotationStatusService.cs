using AutoMapper;
using CRMSys.Application.Dtos.Request;
using CRMSys.Application.Dtos.Response;
using CRMSys.Application.Interfaces.Repositories;
using CRMSys.Application.Interfaces.Services;
using CRMSys.Domain.Entities;
using FluentValidation;
using FluentValidation.Results;
using Shared.Dapper.Interfaces;
using Shared.Dapper.Models;
using Shared.ExternalServices.Interfaces;
using Shared.ExternalServices.Models;
using Shared.ExternalServices.Models.Dynamics;
using Serilog;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using System;
using Newtonsoft.Json;

namespace CRMSys.Application.Services
{
    /// <summary>
    /// Service implementation for managing deal pipeline logic based on Dynamics 365 quotation statuses
    /// </summary>
    public class DealQuotationStatusService : IDealQuotationStatusService
    {
        private readonly IDealRepository _dealRepository;
        private readonly IDealQuotationRepository _dealQuotationRepository;
        private readonly IPipelineLogService _pipelineLogService;
        private readonly IDynamicService _dynamicService;
        private readonly IMapper _mapper;

        public DealQuotationStatusService(
            IDealRepository dealRepository,
            IDealQuotationRepository dealQuotationRepository,
            IPipelineLogService pipelineLogService,
            IDynamicService dynamicService,
            IMapper mapper)
        {
            _dealRepository = dealRepository;
            _dealQuotationRepository = dealQuotationRepository;
            _pipelineLogService = pipelineLogService;
            _dynamicService = dynamicService;
            _mapper = mapper;
        }

        /// <summary>
        /// Evaluate and update deal stage based on quotation statuses from Dynamics 365
        /// </summary>
        public async Task EvaluateAndUpdateDealStageAsync(long dealId, string userEmail, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Evaluating pipeline for deal {DealId}", dealId);

                // 1. Lấy deal hiện tại
                var deal = await _dealRepository.GetByIdAsync(dealId, ct);
                if (deal == null)
                {
                    Log.Warning("Deal {DealId} not found", dealId);
                    return;
                }

                // 2. Lấy danh sách quotation numbers liên quan đến deal
                var quotationNumbers = await GetQuotationNumbersByDealIdAsync(dealId, ct);
                if (!quotationNumbers.Any())
                {
                    Log.Information("No quotations found for deal {DealId}", dealId);
                    return;
                }

                // 3. Lấy statuses từ D365
                var statuses = await GetQuotationStatusesFromDynamicsAsync(quotationNumbers, ct);

                // 4. Áp dụng business logic theo DEAL_README.md
                var newStage = CalculateDealStage(statuses);

                // 5. Cập nhật deal và log pipeline nếu có thay đổi
                if (deal.Stage != newStage)
                {
                    var oldStage = deal.Stage;
                    deal.Stage = newStage;
                    deal.UpdatedBy = userEmail;
                    deal.UpdatedOn = DateTime.UtcNow;

                    // IsClosed is a computed property based on Stage, no need to set it manually

                    await _dealRepository.UpdateAsync(deal, ct);

                    await _pipelineLogService.LogStageChangeAsync(
                        dealId,
                        oldStage,
                        newStage,
                        userEmail,
                        $"Stage updated based on Dynamics 365 quotation statuses: {string.Join(", ", statuses)}",
                        ct);

                    Log.Information("Deal {DealId} stage updated from {OldStage} to {NewStage}", dealId, oldStage, newStage);
                }
                else
                {
                    Log.Information("Deal {DealId} stage unchanged ({Stage})", dealId, deal.Stage);
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error evaluating pipeline for deal {DealId}", dealId);
                throw;
            }
        }

        /// <summary>
        /// Get quotation statuses from Dynamics 365 for given quotation numbers
        /// </summary>
        public async Task<List<string>> GetQuotationStatusesFromDynamicsAsync(IEnumerable<string> quotationNumbers, CancellationToken ct = default)
        {
            var statuses = new List<string>();

            foreach (var quotationNumber in quotationNumbers)
            {
                try
                {
                    // Call Dynamics 365 to get quotation status
                    var status = await GetQuotationStatusFromDynamicsAsync(quotationNumber, ct);
                    if (!string.IsNullOrEmpty(status))
                    {
                        statuses.Add(status);
                    }
                }
                catch (Exception ex)
                {
                    Log.Error(ex, "Error getting status for quotation {QuotationNumber}", quotationNumber);
                    // Continue with other quotations
                }
            }

            return statuses;
        }

        /// <summary>
        /// Trigger pipeline update when quotation status changes in Dynamics 365
        /// </summary>
        public async Task TriggerPipelineUpdateAsync(string quotationNumber, string oldStatus, string newStatus, string userEmail, CancellationToken ct = default)
        {
            try
            {
                Log.Information("Processing quotation status change: {QuotationNumber} from {OldStatus} to {NewStatus}",
                    quotationNumber, oldStatus, newStatus);

                // Find deals associated with this quotation number
                var dealIds = await GetDealIdsByQuotationNumberAsync(quotationNumber, ct);

                foreach (var dealId in dealIds)
                {
                    await EvaluateAndUpdateDealStageAsync(dealId, userEmail, ct);
                }
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error processing quotation status change for {QuotationNumber}", quotationNumber);
                throw;
            }
        }

        /// <summary>
        /// Get all quotation numbers associated with a deal
        /// </summary>
        public async Task<List<string>> GetQuotationNumbersByDealIdAsync(long dealId, CancellationToken ct = default)
        {
            try
            {
                var dealQuotations = await _dealQuotationRepository.GetByDealIdAsync(dealId, ct);
                return dealQuotations.Select(dq => dq.QuotationNumber).Distinct().ToList();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting quotation numbers for deal {DealId}", dealId);
                return new List<string>();
            }
        }

        /// <summary>
        /// Calculate deal stage based on quotation statuses using business rules
        /// </summary>
        private string CalculateDealStage(List<string> statuses)
        {
            if (!statuses.Any())
                return "Prospecting";

            // Priority 1: Closed Won - if any quotation is Approved or Confirmed
            if (statuses.Any(s => s == "Approved" || s == "Confirmed"))
                return "Closed Won";

            // Priority 2: Closed Lost - if ALL quotations are Lost or Cancelled
            if (statuses.All(s => s == "Lost" || s == "Cancelled"))
                return "Closed Lost";

            // Priority 3: Proposal - if any quotation is in active processing state
            if (statuses.Any(s => new[] { "Sent", "Submitted", "Revised", "Modified" }.Contains(s)))
                return "Proposal";

            // Priority 4: Prospecting - default state for draft/reset only quotations
            return "Prospecting";
        }

        /// <summary>
        /// Get quotation status from Dynamics 365 for a single quotation number
        /// </summary>
        private async Task<string?> GetQuotationStatusFromDynamicsAsync(string quotationNumber, CancellationToken ct = default)
        {
            try
            {
                // Build OData URL manually similar to DynController pattern
                // Base URL pattern: /data/SalesQuotationHeadersV2?$filter=SalesQuotationNumber eq 'QT-001'&$select=SalesQuotationStatus
                var baseUrl = "/data/SalesQuotationHeadersV2";
                var filter = $"SalesQuotationNumber eq '{quotationNumber}'";
                var select = "SalesQuotationStatus";
                var url = $"{baseUrl}?$filter={Uri.EscapeDataString(filter)}&$select={select}";

                // Call Dynamics 365 API
                var jsonData = await _dynamicService.QueryAsync(url);

                if (!string.IsNullOrEmpty(jsonData))
                {
                    // Parse JSON response similar to DynController
                    var result = JsonConvert.DeserializeObject<OdataMapper<Domain.Dynamics.SalesQuotationHeadersV2>>(jsonData);

                    if (result?.Items?.Any() == true)
                    {
                        return result.Items.First().SalesQuotationStatus!;
                    }
                }

                return null;
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error calling Dynamics 365 for quotation {QuotationNumber}", quotationNumber);
                throw;
            }
        }

        /// <summary>
        /// Get deal IDs associated with a quotation number
        /// </summary>
        private async Task<List<long>> GetDealIdsByQuotationNumberAsync(string quotationNumber, CancellationToken ct = default)
        {
            try
            {
                var dealQuotations = await _dealQuotationRepository.GetByQuotationNumberAsync(quotationNumber, ct);
                return dealQuotations.Select(dq => dq.DealId).Distinct().ToList();
            }
            catch (Exception ex)
            {
                Log.Error(ex, "Error getting deal IDs for quotation {QuotationNumber}", quotationNumber);
                return new List<long>();
            }
        }
    }
}