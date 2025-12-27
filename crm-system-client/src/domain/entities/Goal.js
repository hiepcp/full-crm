/**
 * Goal domain entity
 * Represents a measurable objective with target value, current progress, ownership, timeframe, and status
 */
export class Goal {
  constructor(data = {}) {
    // Basic Information
    this.id = data.id || null;
    this.name = data.name || '';
    this.description = data.description || '';

    // Target & Progress
    this.targetValue = data.targetValue || null;
    this.progress = data.progress || 0;

    // Dates
    this.startDate = data.startDate || null;
    this.endDate = data.endDate || null;

    // Ownership
    this.ownerUserId = data.ownerUserId || null; // Legacy
    this.ownerType = data.ownerType || 'individual'; // individual, team, company
    this.ownerId = data.ownerId || null;

    // Goal Configuration
    this.type = data.type || null; // revenue, deals, tasks, activities, performance
    this.timeframe = data.timeframe || null; // this_week, this_month, this_quarter, this_year, custom
    this.recurring = data.recurring || false;
    this.status = data.status || 'draft'; // draft, active, completed, cancelled

    // === New: Goal Hierarchy Support ===
    this.parentGoalId = data.parentGoalId || null;

    // === New: Auto-Calculation Support ===
    this.calculationSource = data.calculationSource || 'manual'; // manual, auto_calculated
    this.lastCalculatedAt = data.lastCalculatedAt || null;
    this.calculationFailed = data.calculationFailed || false;
    this.manualOverrideReason = data.manualOverrideReason || null;

    // === New: Forecast Data ===
    this.forecast = data.forecast || null; // Forecast object from API

    // === New: Hierarchy Data ===
    this.hierarchy = data.hierarchy || null; // Hierarchy object from API

    // Audit
    this.createdOn = data.createdOn || null;
    this.createdBy = data.createdBy || null;
    this.updatedOn = data.updatedOn || null;
    this.updatedBy = data.updatedBy || null;
  }

  // === Computed Properties ===

  get isIndividual() {
    return this.ownerType === 'individual';
  }

  get isTeam() {
    return this.ownerType === 'team';
  }

  get isCompany() {
    return this.ownerType === 'company';
  }

  get isDraft() {
    return this.status === 'draft';
  }

  get isActive() {
    return this.status === 'active';
  }

  get isCompleted() {
    return this.status === 'completed';
  }

  get isCancelled() {
    return this.status === 'cancelled';
  }

  get isClosed() {
    return this.isCompleted || this.isCancelled;
  }

  get displayName() {
    return this.name || `Goal ${this.id}`;
  }

  get progressPercentage() {
    if (this.targetValue && this.targetValue > 0) {
      return (this.progress / this.targetValue) * 100;
    }
    return 0;
  }

  get isOverdue() {
    if (this.endDate && !this.isClosed) {
      return new Date(this.endDate) < new Date();
    }
    return false;
  }

  get daysRemaining() {
    if (this.endDate) {
      const diff = new Date(this.endDate) - new Date();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
    return 0;
  }

  // === New: Auto-Calculation Properties ===

  get isAutoCalculated() {
    return this.calculationSource === 'auto_calculated';
  }

  get isManualEntry() {
    return this.calculationSource === 'manual';
  }

  // === New: Hierarchy Properties ===

  get hasParent() {
    return this.parentGoalId !== null;
  }

  get isRootGoal() {
    return this.parentGoalId === null;
  }

  // === Display Helpers ===

  get ownerTypeDisplay() {
    const types = {
      individual: 'Individual',
      team: 'Team',
      company: 'Company'
    };
    return types[this.ownerType] || this.ownerType;
  }

  get typeDisplay() {
    const types = {
      revenue: 'Revenue',
      deals: 'Deals',
      tasks: 'Tasks',
      activities: 'Activities',
      performance: 'Performance'
    };
    return types[this.type] || this.type || 'Unknown';
  }

  get timeframeDisplay() {
    const timeframes = {
      this_week: 'This Week',
      this_month: 'This Month',
      this_quarter: 'This Quarter',
      this_year: 'This Year',
      custom: 'Custom Period'
    };
    return timeframes[this.timeframe] || this.timeframe || 'Unknown';
  }

  get statusDisplay() {
    const statuses = {
      draft: 'Draft',
      active: 'Active',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return statuses[this.status] || this.status;
  }

  // === Business Logic Helpers ===

  updateProgress(newProgress) {
    this.progress = Math.max(0, Math.min(this.targetValue || 0, newProgress));
  }

  updateProgressPercentage(percentage) {
    if (this.targetValue && this.targetValue > 0) {
      this.progress = (percentage / 100) * this.targetValue;
    }
  }

  changeStatus(newStatus) {
    const validStatuses = ['draft', 'active', 'completed', 'cancelled'];
    if (validStatuses.includes(newStatus)) {
      this.status = newStatus;
      return true;
    }
    return false;
  }

  complete() {
    this.status = 'completed';
    // Set progress to target if not already met
    if (this.targetValue && this.progress < this.targetValue) {
      this.progress = this.targetValue;
    }
  }

  cancel() {
    this.status = 'cancelled';
  }

  activate() {
    this.status = 'active';
  }

  setOwnership(ownerType, ownerId) {
    this.ownerType = ownerType;
    this.ownerId = ownerId;

    // For backward compatibility, set ownerUserId for individual goals
    if (ownerType === 'individual' && ownerId) {
      this.ownerUserId = ownerId;
    } else {
      this.ownerUserId = null;
    }
  }
}

export default Goal;
