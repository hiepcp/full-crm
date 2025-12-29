using System.ComponentModel.DataAnnotations.Schema;

namespace CRMSys.Domain.Entities
{
    /// <summary>
    /// ActivityParticipant entity representing participants in activities
    /// </summary>
    [Table("crm_activity_participant")]
    public class ActivityParticipant : BaseEntity
    {
        // === Primary Key ===
        public long Id { get; set; }

        // === Relations ===
        public long ActivityId { get; set; }
        public long? ContactId { get; set; }
        public long? UserId { get; set; }

        // === Participant Details ===
        public string Role { get; set; } = "attendee"; // attendee, organizer, to, cc, bcc, etc.

        // === Computed Properties ===
        [NotMapped]
        public bool IsAttendee => Role == "attendee";
        [NotMapped]
        public bool IsOrganizer => Role == "organizer";
        [NotMapped]
        public bool IsToRecipient => Role == "to";
        [NotMapped]
        public bool IsCcRecipient => Role == "cc";
        [NotMapped]
        public bool IsBccRecipient => Role == "bcc";
        [NotMapped]
        public bool HasValidParticipant => ContactId.HasValue || UserId.HasValue;
        [NotMapped]
        public string DisplayRole => Role switch
        {
            "attendee" => "Attendee",
            "organizer" => "Organizer",
            "to" => "To",
            "cc" => "CC",
            "bcc" => "BCC",
            _ => Role
        };

        // === Business Logic Helpers ===
        [NotMapped]
        public bool IsEmailParticipant => IsToRecipient || IsCcRecipient || IsBccRecipient;

        /// <summary>
        /// Change role with validation
        /// </summary>
        public bool ChangeRole(string newRole)
        {
            var validRoles = new[] { "attendee", "organizer", "to", "cc", "bcc" };
            if (!validRoles.Contains(newRole))
                return false;

            Role = newRole;
            return true;
        }
    }
}
