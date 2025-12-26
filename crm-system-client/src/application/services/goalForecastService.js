/**
 * Goal forecast and velocity calculation service
 * Handles forecast predictions based on progress history and velocity
 */

/**
 * Calculate daily velocity from progress history
 * @param {Array} progressHistory - Array of progress snapshots
 * @returns {number} Average daily velocity
 */
export const calculateDailyVelocity = (progressHistory) => {
  if (!progressHistory || progressHistory.length < 2) return 0;

  const sortedHistory = [...progressHistory].sort(
    (a, b) => new Date(a.snapshotTimestamp) - new Date(b.snapshotTimestamp)
  );

  const velocities = [];

  for (let i = 1; i < sortedHistory.length; i++) {
    const previous = sortedHistory[i - 1];
    const current = sortedHistory[i];

    const progressChange = current.progressValue - previous.progressValue;
    const timeChange =
      (new Date(current.snapshotTimestamp) - new Date(previous.snapshotTimestamp)) /
      (1000 * 60 * 60 * 24); // Convert to days

    if (timeChange > 0) {
      velocities.push(progressChange / timeChange);
    }
  }

  if (velocities.length === 0) return 0;

  return velocities.reduce((sum, v) => sum + v, 0) / velocities.length;
};

/**
 * Calculate weekly velocity
 * @param {number} dailyVelocity - Daily velocity
 * @returns {number} Weekly velocity
 */
export const calculateWeeklyVelocity = (dailyVelocity) => {
  return dailyVelocity * 7;
};

/**
 * Calculate required daily velocity to meet goal
 * @param {number} remainingProgress - Progress remaining to target
 * @param {number} daysRemaining - Days until end date
 * @returns {number} Required daily velocity
 */
export const calculateRequiredVelocity = (remainingProgress, daysRemaining) => {
  if (daysRemaining <= 0) return 0;
  return remainingProgress / daysRemaining;
};

/**
 * Estimate completion date based on current velocity
 * @param {number} remainingProgress - Progress remaining to target
 * @param {number} dailyVelocity - Current daily velocity
 * @returns {Date|null} Estimated completion date
 */
export const estimateCompletionDate = (remainingProgress, dailyVelocity) => {
  if (dailyVelocity <= 0 || remainingProgress <= 0) return null;

  const daysToComplete = Math.ceil(remainingProgress / dailyVelocity);
  const completionDate = new Date();
  completionDate.setDate(completionDate.getDate() + daysToComplete);

  return completionDate;
};

/**
 * Determine forecast status
 * @param {object} params - Forecast parameters
 * @returns {string} Forecast status (ahead, on-track, behind, at-risk, insufficient-data)
 */
export const determineForecastStatus = ({
  dailyVelocity,
  requiredVelocity,
  estimatedCompletionDate,
  endDate,
  remainingProgress,
  dataPointsCount
}) => {
  // Insufficient data
  if (dataPointsCount < 2) {
    return 'insufficient-data';
  }

  // Already completed or no progress remaining
  if (remainingProgress <= 0) {
    return 'on-track';
  }

  // No velocity (stagnant)
  if (dailyVelocity <= 0) {
    return 'at-risk';
  }

  // Compare estimated completion with end date
  if (estimatedCompletionDate && endDate) {
    const end = new Date(endDate);

    if (estimatedCompletionDate > end) {
      return 'behind';
    }

    if (dailyVelocity >= requiredVelocity * 1.2) {
      return 'ahead';
    }
  }

  return 'on-track';
};

/**
 * Get confidence level based on data points
 * @param {number} dataPointsCount - Number of progress history data points
 * @returns {string} Confidence level (high, medium, low)
 */
export const getConfidenceLevel = (dataPointsCount) => {
  if (dataPointsCount >= 10) return 'high';
  if (dataPointsCount >= 5) return 'medium';
  return 'low';
};

/**
 * Get forecast status color
 * @param {string} status - Forecast status
 * @returns {string} MUI color (success, warning, error, info, default)
 */
export const getForecastStatusColor = (status) => {
  const colorMap = {
    ahead: 'success',
    'on-track': 'success',
    behind: 'warning',
    'at-risk': 'error',
    'insufficient-data': 'default'
  };

  return colorMap[status] || 'default';
};

/**
 * Get forecast status label
 * @param {string} status - Forecast status
 * @returns {string} Human-readable label
 */
export const getForecastStatusLabel = (status) => {
  const labelMap = {
    ahead: 'Ahead of Schedule',
    'on-track': 'On Track',
    behind: 'Behind Schedule',
    'at-risk': 'At Risk',
    'insufficient-data': 'Insufficient Data'
  };

  return labelMap[status] || 'Unknown';
};

/**
 * Generate forecast message
 * @param {object} forecast - Forecast data from API
 * @returns {string} Forecast message
 */
export const generateForecastMessage = (forecast) => {
  if (!forecast) return '';

  const { forecastStatus, estimatedCompletionDate, daysRemaining, message } = forecast;

  if (message) return message;

  if (forecastStatus === 'insufficient-data') {
    return 'Not enough data for accurate forecasting. Need at least 2 progress snapshots.';
  }

  if (forecastStatus === 'at-risk') {
    return `Goal is at risk. No recent progress detected. ${daysRemaining} days remaining.`;
  }

  if (forecastStatus === 'behind') {
    const estimated = new Date(estimatedCompletionDate);
    return `Estimated completion: ${estimated.toLocaleDateString()}. May miss deadline by ${Math.abs(
      daysRemaining
    )} days.`;
  }

  if (forecastStatus === 'ahead') {
    return `Great progress! On track to complete ahead of schedule.`;
  }

  return `On track to complete on time. ${daysRemaining} days remaining.`;
};

/**
 * Calculate forecast from progress history (client-side)
 * @param {object} goal - Goal object with progress and dates
 * @param {Array} progressHistory - Progress history snapshots
 * @returns {object} Forecast object
 */
export const calculateForecast = (goal, progressHistory) => {
  const { progress, targetValue, endDate } = goal;

  const remainingProgress = (targetValue || 0) - (progress || 0);
  const daysRemaining = endDate
    ? Math.ceil((new Date(endDate) - new Date()) / (1000 * 60 * 60 * 24))
    : 0;

  const dailyVelocity = calculateDailyVelocity(progressHistory);
  const weeklyVelocity = calculateWeeklyVelocity(dailyVelocity);
  const requiredVelocity = calculateRequiredVelocity(remainingProgress, daysRemaining);
  const estimatedDate = estimateCompletionDate(remainingProgress, dailyVelocity);

  const forecastStatus = determineForecastStatus({
    dailyVelocity,
    requiredVelocity,
    estimatedCompletionDate: estimatedDate,
    endDate,
    remainingProgress,
    dataPointsCount: progressHistory?.length || 0
  });

  const confidenceLevel = getConfidenceLevel(progressHistory?.length || 0);

  return {
    currentProgress: progress,
    targetValue,
    progressPercentage: goal.progressPercentage || 0,
    dailyVelocity,
    weeklyVelocity,
    requiredDailyVelocity: requiredVelocity,
    estimatedCompletionDate: estimatedDate,
    daysRemaining,
    forecastStatus,
    confidenceLevel,
    dataPointsCount: progressHistory?.length || 0,
    message: generateForecastMessage({
      forecastStatus,
      estimatedCompletionDate: estimatedDate,
      daysRemaining
    })
  };
};

export default {
  calculateDailyVelocity,
  calculateWeeklyVelocity,
  calculateRequiredVelocity,
  estimateCompletionDate,
  determineForecastStatus,
  getConfidenceLevel,
  getForecastStatusColor,
  getForecastStatusLabel,
  generateForecastMessage,
  calculateForecast
};
