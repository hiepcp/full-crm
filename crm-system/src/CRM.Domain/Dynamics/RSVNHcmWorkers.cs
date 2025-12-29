using System.Text.Json.Serialization;

namespace CRMSys.Domain.Dynamics
{
    public class RSVNHcmWorkers : RSVNModelBase
    {
        [JsonIgnore]
        public override int ModelType => 7;
        [JsonIgnore]
        public override string EntityName => "RSVNHcmWorkers";
        [JsonIgnore]
        public override Dictionary<string, string> FilterableFields => new()
        {
            { "PersonnelNumber", "PersonnelNumber" },
            { "Name", "AttributeKey" },
            { "SysEmail", "SysEmail" },
            { "Email", "Email" }
        };

        public string? PersonnelNumber { get; set; }
        public string? Name { get; set; }
        public string? SysEmail { get; set; }
        public string? Email { get; set; }
    }
}

