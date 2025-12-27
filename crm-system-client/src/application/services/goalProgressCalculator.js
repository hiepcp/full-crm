/**
 * Client-side goal progress calculation logic
 * Mirrors backend calculation for UI preview and validation
 */

/**
 * Calculate progress percentage from current progress and target value
 * @param {number} progress - Current progress value
 * @param {number} targetValue - Target value to reach
 * @returns {number} Progress percentage (0-100)
 */
export const calculateProgressPercentage = (progress, targetValue) => {
  if (!targetValue || targetValue === 0) return 0;
  const percentage = (progress / targetValue) * 100;
  return Math.min(Math.max(percentage, 0), 100); // Clamp between 0-100
};

/**
 * Calculate days remaining until goal end date
 * @param {Date|string} endDate - Goal end date
 * @returns {number} Days remaining (negative if overdue)
 */
export const calculateDaysRemaining = (endDate) => {
  if (!endDate) return 0;
  const end = new Date(endDate);
  const now = new Date();
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

/**
 * Calculate time elapsed percentage
 * @param {Date|string} startDate - Goal start date
 * @param {Date|string} endDate - Goal end date
 * @returns {number} Time elapsed percentage (0-100)
 */
export const calculateTimeElapsedPercentage = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  const now = new Date().getTime();

  if (now < start) return 0;
  if (now > end) return 100;

  const totalDuration = end - start;
  const elapsed = now - start;

  return (elapsed / totalDuration) * 100;
};

/**
 * Determine if goal is at risk (< 50% progress with < 50% time remaining)
 * @param {number} progressPercentage - Current progress percentage
 * @param {number} timeElapsedPercentage - Time elapsed percentage
 * @returns {boolean} True if goal is at risk
 */
export const isGoalAtRisk = (progressPercentage, timeElapsedPercentage) => {
  // At risk if progress is less than time elapsed by significant margin
  if (timeElapsedPercentage >= 50 && progressPercentage < 50) {
    return true;
  }

  // At risk if less than 50% complete with less than 50% time remaining
  const timeRemainingPercentage = 100 - timeElapsedPercentage;
  if (progressPercentage < 50 && timeRemainingPercentage < 50) {
    return true;
  }

  return false;
};

/**
 * Determine if goal is overdue
 * @param {Date|string} endDate - Goal end date
 * @param {number} progressPercentage - Current progress percentage
 * @returns {boolean} True if goal is overdue
 */
export const isGoalOverdue = (endDate, progressPercentage) => {
  if (!endDate || progressPercentage >= 100) return false;
  const daysRemaining = calculateDaysRemaining(endDate);
  return daysRemaining < 0;
};

/**
 * Determine if goal needs attention (not updated in 14 days)
 * @param {Date|string} lastCalculatedAt - Last calculation timestamp
 * @returns {boolean} True if goal needs attention
 */
export const needsAttention = (lastCalculatedAt) => {
  if (!lastCalculatedAt) return true;

  const lastUpdate = new Date(lastCalculatedAt);
  const now = new Date();
  const daysSinceUpdate = Math.floor((now - lastUpdate) / (1000 * 60 * 60 * 24));

  return daysSinceUpdate >= 14;
};

/**
 * Get goal status badge info
 * @param {object} goal - Goal object with progress, dates, and calculation info
 * @returns {object} Badge info with status, label, color
 */
export const getGoalStatusBadge = (goal) => {
  const { progressPercentage, startDate, endDate, lastCalculatedAt } = goal;

  // Check if completed
  if (progressPercentage >= 100) {
    return { status: 'completed', label: 'Completed', color: 'success' };
  }

  // Check if overdue
  if (isGoalOverdue(endDate, progressPercentage)) {
    return { status: 'overdue', label: 'Overdue', color: 'error' };
  }

  const timeElapsed = calculateTimeElapsedPercentage(startDate, endDate);
  const daysRemaining = calculateDaysRemaining(endDate);

  // Almost there (>90% complete, <7 days remaining)
  if (progressPercentage >= 90 && daysRemaining <= 7 && daysRemaining > 0) {
    return { status: 'almost-there', label: 'Almost There', color: 'info' };
  }

  // At risk
  if (isGoalAtRisk(progressPercentage, timeElapsed)) {
    return { status: 'at-risk', label: 'At Risk', color: 'warning' };
  }

  // Needs attention
  if (needsAttention(lastCalculatedAt)) {
    return { status: 'needs-attention', label: 'Needs Attention', color: 'warning' };
  }

  // On track
  return { status: 'on-track', label: 'On Track', color: 'success' };
};

/**
 * Format progress display text
 * @param {number} progress - Current progress value
 * @param {number} targetValue - Target value
 * @param {string} type - Goal type (revenue, deals, activities, tasks)
 * @returns {string} Formatted progress text
 */
export const formatProgressDisplay = (progress, targetValue, type) => {
  const formatNumber = (num) => {
    if (type === 'revenue') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(num);
    }
    return num.toLocaleString();
  };

  return `${formatNumber(progress)} / ${formatNumber(targetValue)}`;
};

/**
 * Validate manual progress adjustment
 * @param {number} newProgress - New progress value
 * @param {number} targetValue - Target value
 * @param {string} justification - Justification text
 * @returns {object} Validation result with isValid and errors
 */
export const validateManualAdjustment = (newProgress, targetValue, justification) => {
  const errors = [];

  if (newProgress < 0) {
    errors.push('Progress cannot be negative');
  }

  if (newProgress > targetValue) {
    errors.push('Progress cannot exceed target value');
  }

  if (!justification || justification.trim().length < 10) {
    errors.push('Justification must be at least 10 characters');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export default {
  calculateProgressPercentage,
  calculateDaysRemaining,
  calculateTimeElapsedPercentage,
  isGoalAtRisk,
  isGoalOverdue,
  needsAttention,
  getGoalStatusBadge,
  formatProgressDisplay,
  validateManualAdjustment
};
