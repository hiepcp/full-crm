using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("CRM_category_sync_audit_log")]
    public class CategorySyncAuditLog : BaseEntity
    {
        public long Id { get; set; }
        public DateTime SyncStartedOn { get; set; }
        public DateTime? SyncCompletedOn { get; set; }
        public string SyncStatus { get; set; } = string.Empty;
        public string? SyncDirection { get; set; }
        public int CategoriesCreated { get; set; }
        public int CategoriesUpdated { get; set; }
        public int CategoriesDeleted { get; set; }
        public int ConflictsResolved { get; set; }
        public int ErrorsEncountered { get; set; }
        public string? ErrorDetails { get; set; }
        public string? ChangesSummary { get; set; }
        public string? TriggerSource { get; set; }
        public string? TriggeredBy { get; set; }
    }
}
