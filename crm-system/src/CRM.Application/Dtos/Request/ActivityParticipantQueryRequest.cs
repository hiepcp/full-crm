using System.Text.Json.Serialization;

namespace CRMSys.Application.Dtos.Request
{
    public class ActivityParticipantQueryRequest
    {
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;

        public long? ActivityId { get; set; }
        public long? ContactId { get; set; }
        public long? UserId { get; set; }
        public string? Role { get; set; }

        public string? OrderBy { get; set; } = "-id";

        [JsonExtensionData]
        public Dictionary<string, object>? ExtensionData { get; set; }
    }
}

