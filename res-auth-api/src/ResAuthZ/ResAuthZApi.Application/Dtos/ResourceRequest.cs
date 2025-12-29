using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ResAuthZApi.Application.Dtos
{
    public class ResourceRequest
    {
        public int AppId { get; set; }
        public string Code { get; set; } = null!;
        public string Name { get; set; } = null!;
        public string? Description { get; set; }
        public List<int> Actions { get; set; } = new();  // danh sách ActionId
    }
}
