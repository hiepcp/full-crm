using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ResAuthApi.Domain.Entities
{
    [Table("users")]
    public class User
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }

        [StringLength(50)]
        public string? Email { get; set; }

        [StringLength(255)]
        public string? Name { get; set; }
        [StringLength(255)]
        public string? FirstName { get; set; }

        [StringLength(255)]
        public string? LastName { get; set; }

        [StringLength(500)]
        public string? AvatarUrl { get; set; }
        [Required]
        [StringLength(50)]
        public string CreatedBy { get; set; } = string.Empty;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public bool Active { get; set; } = true;
    }
}
