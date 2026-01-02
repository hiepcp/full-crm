using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("crm_team_members")]
    public class TeamMember : BaseEntity
    {
        public long Id { get; set; }

        public long TeamId { get; set; }
        public string UserEmail { get; set; } = string.Empty;
        public TeamRole Role { get; set; }
    }
}