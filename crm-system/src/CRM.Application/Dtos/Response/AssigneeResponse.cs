namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO for Assignee data
    /// </summary>
    public class AssigneeResponse
    {
        // === Basic Identity ===
        public long Id { get; set; }
        public DateTime CreatedOn { get; set; }
        public string? CreatedBy { get; set; }
        public DateTime? UpdatedOn { get; set; }
        public string? UpdatedBy { get; set; }

        // === Assignment Details ===
        public string RelationType { get; set; } = string.Empty;
        public long RelationId { get; set; }
        public string UserEmail { get; set; } = string.Empty; // Primary identifier - user email
        public string Role { get; set; } = "collaborator";
        public DateTime AssignedAt { get; set; }
        public string? Notes { get; set; }

        // === User Information (for display purposes) ===
        public string? UserFirstName { get; set; }
        public string? UserLastName { get; set; }
        public string? UserAvatar { get; set; }

        // === Computed Properties ===
        public string UserFullName => $"{UserFirstName} {UserLastName}".Trim();
        public string UserDisplayName => !string.IsNullOrEmpty(UserFullName) ? UserFullName : UserEmail ?? "Unknown User";
        public string UserInitials => GetUserInitials();
        public string DisplayRole => Role switch
        {
            "owner" => "Owner",
            "collaborator" => "Collaborator",
            "follower" => "Follower",
            _ => Role
        };
        public TimeSpan AssignmentAge => DateTime.UtcNow - AssignedAt;
        public int DaysSinceAssigned => (int)AssignmentAge.TotalDays;

        // === Status Helpers ===
        public bool IsOwner => Role == "owner";
        public bool IsCollaborator => Role == "collaborator";
        public bool IsFollower => Role == "follower";

        // === Relation Type Helpers ===
        public bool IsRelatedToLead => RelationType == "lead";
        public bool IsRelatedToContact => RelationType == "contact";
        public bool IsRelatedToDeal => RelationType == "deal";
        public bool IsRelatedToCustomer => RelationType == "customer";
        public bool IsRelatedToActivity => RelationType == "activity";

        private string GetUserInitials()
        {
            var parts = UserFullName.Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length >= 2)
            {
                return $"{parts[0][0]}{parts[1][0]}".ToUpper();
            }
            else if (parts.Length == 1)
            {
                return parts[0].Substring(0, Math.Min(2, parts[0].Length)).ToUpper();
            }
            else if (!string.IsNullOrEmpty(UserEmail))
            {
                return UserEmail.Substring(0, Math.Min(2, UserEmail.Length)).ToUpper();
            }
            return "U";
        }

        /// <summary>
        /// Get field value by name (for dynamic field selection)
        /// </summary>
        public object? GetFieldValue(string fieldName)
        {
            return fieldName.ToLower() switch
            {
                "id" => Id,
                "relationtype" => RelationType,
                "relationid" => RelationId,
                "useremail" => UserEmail,
                "role" => Role,
                "assignedat" => AssignedAt,
                "notes" => Notes,
                "userfirstname" => UserFirstName,
                "userlastname" => UserLastName,
                "useravatar" => UserAvatar,
                "userfullname" => UserFullName,
                "userdisplayname" => UserDisplayName,
                "userinitials" => UserInitials,
                "displayrole" => DisplayRole,
                "dayssinceassigned" => DaysSinceAssigned,
                "createdon" => CreatedOn,
                "createdby" => CreatedBy,
                "updatedon" => UpdatedOn,
                "updatedby" => UpdatedBy,
                _ => null
            };
        }
    }
}













