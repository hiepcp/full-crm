namespace CRMSys.Application.Dtos.Response
{
    public class CRMDynReferenceResponseDto
    {
        private static readonly Random random = new Random();
        public string Id { get; set; } = random.Next(1, 9999).ToString();
        public string? Code { get; set; }
        public string? Name { get; set; }
    }
}
