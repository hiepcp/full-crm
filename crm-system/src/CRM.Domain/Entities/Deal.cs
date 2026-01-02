using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// Deal entity representing a sales deal/opportunity
    /// </summary>
    [Table("crm_deal")]
    public class Deal : BaseEntity
    {
        public long Id { get; set; }

        public long? CustomerId { get; set; }
        public long? OwnerId { get; set; }
        public long? LeadId { get; set; }
        public long? SalesTeamId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }

        public string Stage { get; set; } = "Prospecting"; // ENUM: Prospecting, Quotation, Proposal, Negotiation, Closed Won, Closed Lost, On Hold
        public decimal? ExpectedRevenue { get; set; }
        public decimal? ActualRevenue { get; set; }
        public DateTime? CloseDate { get; set; }

        // === Contact Information ===
        public long? ContactId { get; set; }

        // === Additional Information ===
        public string? Note { get; set; }

        // === Computed Properties ===
        [NotMapped]
        public bool IsProspecting => Stage == "Prospecting";
        [NotMapped]
        public bool IsQuotation => Stage == "Quotation";
        [NotMapped]
        public bool IsProposal => Stage == "Proposal";
        [NotMapped]
        public bool IsNegotiation => Stage == "Negotiation";
        [NotMapped]
        public bool IsClosedWon => Stage == "Closed Won";
        [NotMapped]
        public bool IsClosedLost => Stage == "Closed Lost";
        [NotMapped]
        public bool IsOnHold => Stage == "On Hold";
        [NotMapped]
        public bool IsClosed => IsClosedWon || IsClosedLost;
        [NotMapped]
        public bool IsOpen => !IsClosed;
        [NotMapped]
        public string DisplayName => !string.IsNullOrEmpty(Name) ? Name : $"Deal {Id}";
        [NotMapped]
        public decimal Revenue => ActualRevenue ?? ExpectedRevenue ?? 0;
        [NotMapped]
        public int DaysToClose => CloseDate.HasValue ? (int)(CloseDate.Value - DateTime.UtcNow).TotalDays : 0;
        [NotMapped]
        public bool IsOverdue => CloseDate.HasValue && CloseDate.Value < DateTime.UtcNow && IsOpen;
        [NotMapped]
        public double Probability => Stage switch
        {
            "Prospecting" => 10,
            "Quotation" => 30,
            "Proposal" => 60,
            "Negotiation" => 80,
            "Closed Won" => 100,
            "Closed Lost" => 0,
            "On Hold" => 20,
            _ => 0
        };

        // === Business Logic Helpers ===
        [NotMapped]
        public bool CanBeClosed => IsOpen && CustomerId.HasValue;
        [NotMapped]
        public bool NeedsFollowUp => IsOpen && CloseDate.HasValue && CloseDate.Value < DateTime.UtcNow.AddDays(7);

        /// <summary>
        /// Change deal stage with validation
        /// </summary>
        public bool ChangeStage(string newStage)
        {
            var validStages = new[] { "Prospecting", "Quotation", "Proposal", "Negotiation", "Closed Won", "Closed Lost", "On Hold" };
            if (!validStages.Contains(newStage))
                return false;

            Stage = newStage;

            // Auto-set close date for closed deals
            if (IsClosed && !CloseDate.HasValue)
            {
                CloseDate = DateTime.UtcNow;
            }

            return true;
        }

        /// <summary>
        /// Close deal as won
        /// </summary>
        public void CloseAsWon(decimal? actualRevenue = null)
        {
            Stage = "Closed Won";
            ActualRevenue = actualRevenue ?? ExpectedRevenue;
            CloseDate = DateTime.UtcNow;
        }

        /// <summary>
        /// Close deal as lost
        /// </summary>
        public void CloseAsLost()
        {
            Stage = "Closed Lost";
            CloseDate = DateTime.UtcNow;
        }

        /// <summary>
        /// Assign to new owner
        /// </summary>
        public void AssignTo(long ownerId)
        {
            OwnerId = ownerId;
        }

        /// <summary>
        /// Update expected revenue
        /// </summary>
        public void UpdateExpectedRevenue(decimal revenue)
        {
            ExpectedRevenue = revenue;
        }

        /// <summary>
        /// Set close date
        /// </summary>
        public void SetCloseDate(DateTime closeDate)
        {
            CloseDate = closeDate;
        }
    }
}
