namespace CRMSys.Application.Dtos.Teams
{
    public class CreateTeamRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}