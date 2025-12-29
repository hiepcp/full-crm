
namespace CRMSys.Application.Dtos
{
    public class ODataQueryParameters
    {
        public int Skip { get; set; } = 0;
        public int Top { get; set; } = 2147483647;
        public string Filter { get; set; } = "";
        public string OrderBy { get; set; } = "";
    }
}
