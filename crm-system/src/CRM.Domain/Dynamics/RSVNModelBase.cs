namespace CRMSys.Domain.Dynamics
{
    public abstract class RSVNModelBase
    {        
        public abstract int ModelType { get; }     
        public abstract string EntityName { get; }

        // Thay vì 1 FilterField, có dictionary của tất cả fields có thể filter        
        public abstract Dictionary<string, string> FilterableFields { get; }
    }
}
