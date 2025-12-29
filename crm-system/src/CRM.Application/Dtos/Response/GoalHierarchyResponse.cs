namespace CRMSys.Application.Dtos.Response
{
    /// <summary>
    /// Response DTO for goal hierarchy (tree structure with ancestors and descendants)
    /// </summary>
    public class GoalHierarchyResponse
    {
        /// <summary>
        /// The goal at the center of the hierarchy query
        /// </summary>
        public GoalResponse Goal { get; set; } = null!;

        /// <summary>
        /// Ancestors (parent, grandparent, etc.) ordered from immediate parent to root
        /// </summary>
        public List<GoalResponse> Ancestors { get; set; } = new();

        /// <summary>
        /// Direct children of this goal
        /// </summary>
        public List<GoalResponse> Children { get; set; } = new();

        /// <summary>
        /// All descendants (children, grandchildren, etc.) in hierarchical order
        /// </summary>
        public List<GoalResponse> Descendants { get; set; } = new();

        /// <summary>
        /// Hierarchy depth (0 = root, 1 = has parent, 2 = has grandparent)
        /// </summary>
        public int Depth { get; set; }

        /// <summary>
        /// Total number of descendants
        /// </summary>
        public int DescendantCount => Descendants.Count;

        /// <summary>
        /// Whether this goal is a root goal (no parent)
        /// </summary>
        public bool IsRoot => Depth == 0;

        /// <summary>
        /// Whether this goal is a leaf goal (no children)
        /// </summary>
        public bool IsLeaf => Children.Count == 0;

        /// <summary>
        /// Aggregated progress from all children (if any)
        /// </summary>
        public decimal? AggregatedChildProgress { get; set; }

        /// <summary>
        /// Aggregated target from all children (if any)
        /// </summary>
        public decimal? AggregatedChildTarget { get; set; }

        /// <summary>
        /// Aggregated progress percentage from children
        /// </summary>
        public decimal? AggregatedChildProgressPercentage =>
            AggregatedChildTarget.HasValue && AggregatedChildTarget.Value > 0
                ? (AggregatedChildProgress ?? 0) / AggregatedChildTarget.Value * 100
                : null;
    }
}
