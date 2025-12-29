using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ResAuthZApi.Application.Interfaces.Repositories
{
    public interface IResourceActionRepository
    {
        Task AddResourceActionAsync(int resourceId, int actionId);
        Task DeleteByResourceIdAsync(int resourceId);
    }
}
