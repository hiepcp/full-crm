using System.ComponentModel.DataAnnotations;

namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Orchestrated request to create a Lead together with its initial Activity
    /// in a single transactional operation.
    /// </summary>
    public class CreateLeadWithActivityRequest
    {
        [Required]
        public CreateLeadRequest Lead { get; set; } = default!;

        [Required]
        public CreateActivityRequest Activity { get; set; } = default!;
    }
}

