namespace CRMSys.Application.Dtos
{
    public class CacheSettings
    {
        public TimeSpan CacheExpiration { get; set; } = TimeSpan.FromMinutes(1440);
        public TimeSpan CacheExpirationSo { get; set; } = TimeSpan.FromMinutes(30);
    }    
}
