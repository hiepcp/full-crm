namespace CRMSys.Application.Dtos.Request
{
    /// <summary>
    /// Request to link a goal to a parent goal
    /// </summary>
    public class LinkGoalToParentRequest
    {
        /// <summary>
        /// Parent goal ID to link to
        /// </summary>
        public long ParentGoalId { get; set; }

        /// <summary>
        /// Optional contribution weight (for weighted roll-up calculations)
        /// Default: null (equal weight)
        /// </summary>
        public decimal? ContributionWeight { get; set; }
    }
}
