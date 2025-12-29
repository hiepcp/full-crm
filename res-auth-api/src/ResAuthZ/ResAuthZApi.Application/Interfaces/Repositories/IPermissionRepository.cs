namespace ResAuthZApi.Application.Interfaces.Repositories
{
    public interface IPermissionRepository
    {
        Task DeleteByResourceIdAsync(int resourceId);
    }
}
