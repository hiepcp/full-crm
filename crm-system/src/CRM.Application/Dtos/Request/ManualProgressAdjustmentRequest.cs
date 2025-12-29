namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request DTO for manual progress adjustment with required justification
    /// </summary>
    public class ManualProgressAdjustmentRequest
    {
        public decimal NewProgress { get; set; }
        public string Justification { get; set; } = string.Empty;
    }
}
