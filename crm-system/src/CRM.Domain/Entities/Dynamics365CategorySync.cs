using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("CRM_dynamics365_category_sync")]
    public class Dynamics365CategorySync : BaseEntity
    {
        public long Id { get; set; }
        public long? CRMCategoryId { get; set; }
        public string? Dynamics365CategoryId { get; set; }
        public DateTime? LastSyncedOn { get; set; }
        public string SyncStatus { get; set; } = string.Empty;
        public string? SyncDirection { get; set; }
        public string? ErrorMessage { get; set; }
        public int RetryCount { get; set; }
        public DateTime? NextRetryOn { get; set; }
    }
}
