using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthApi.Domain.Entities
{
    [Table("response_config_system")]
    public class ResponseConfigSystem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        
        [MaxLength(255)]
        public string? AppName { get; set; }
               
        public int Env { get; set; }

        [MaxLength(255)]
        public string? ServiceName { get; set; }

        [MaxLength(255)]
        public string? AuthUrl { get; set; }

        [MaxLength(40)]
        public string? TenantId { get; set; }

        [MaxLength(255)]
        public string? ClientId { get; set; }

        public string? ClientSecret { get; set; }

        [MaxLength(50)]
        public string? GrantType { get; set; }

        [MaxLength(255)]
        public string? Resource { get; set; }

        public string? Scope { get; set; }
        public string? AccessToken { get; set; }
        public long? TokenExpiry { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}
