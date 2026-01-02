using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    [Table("crm_sales_teams")]
    public class SalesTeam : BaseEntity
    {
        public long Id { get; set; }

        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string GroupMail { get; set; } = string.Empty;


    }
}