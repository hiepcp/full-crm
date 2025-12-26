/**
 * dateCalculationHelper.js
 *
 * Utility functions for calculating start and end dates based on timeframes
 * Used for smart auto-population in goal templates
 *
 * Phase 5: Goal Templates & Quick Creation
 */

/**
 * Calculate start and end dates for a given timeframe
 * @param {string} timeframe - One of: 'this_week', 'this_month', 'this_quarter', 'this_year', 'custom'
 * @returns {object} - { startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD' }
 */
export const calculateTimeframeDates = (timeframe) => {
  const now = new Date();
  let startDate, endDate;

  switch (timeframe) {
    case 'this_week': {
      // Week starts on Monday (ISO week)
      const dayOfWeek = now.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, others shift by -1

      startDate = new Date(now);
      startDate.setDate(now.getDate() - diff);
      startDate.setHours(0, 0, 0, 0);

      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case 'this_month': {
      // First day of current month
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      startDate.setHours(0, 0, 0, 0);

      // Last day of current month
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case 'this_quarter': {
      // Determine current quarter (0-3)
      const quarter = Math.floor(now.getMonth() / 3);

      // First day of quarter
      startDate = new Date(now.getFullYear(), quarter * 3, 1);
      startDate.setHours(0, 0, 0, 0);

      // Last day of quarter
      endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case 'this_year': {
      // First day of current year
      startDate = new Date(now.getFullYear(), 0, 1);
      startDate.setHours(0, 0, 0, 0);

      // Last day of current year
      endDate = new Date(now.getFullYear(), 11, 31);
      endDate.setHours(23, 59, 59, 999);
      break;
    }

    case 'custom':
      // Return null for custom - user will manually set dates
      return { startDate: null, endDate: null };

    default:
      // Default to this month if unknown timeframe
      return calculateTimeframeDates('this_month');
  }

  // Format as YYYY-MM-DD for input[type="date"]
  const formatDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(startDate),
    endDate: formatDate(endDate)
  };
};

/**
 * Get human-readable timeframe description
 * @param {string} timeframe
 * @returns {string} - Description like "Jan 1 - Jan 31, 2025"
 */
export const getTimeframeDescription = (timeframe) => {
  const dates = calculateTimeframeDates(timeframe);

  if (!dates.startDate || !dates.endDate) {
    return 'Custom date range';
  }

  const formatDateRange = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    const options = { month: 'short', day: 'numeric' };
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);
    const year = endDate.getFullYear();

    return `${startStr} - ${endStr}, ${year}`;
  };

  return formatDateRange(dates.startDate, dates.endDate);
};

/**
 * Calculate days remaining in timeframe
 * @param {string} endDate - YYYY-MM-DD format
 * @returns {number} - Days remaining (negative if overdue)
 */
export const calculateDaysRemaining = (endDate) => {
  if (!endDate) return null;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  const diff = end - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

/**
 * Check if timeframe is currently active
 * @param {string} startDate - YYYY-MM-DD format
 * @param {string} endDate - YYYY-MM-DD format
 * @returns {boolean}
 */
export const isTimeframeActive = (startDate, endDate) => {
  if (!startDate || !endDate) return false;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(endDate);
  end.setHours(23, 59, 59, 999);

  return now >= start && now <= end;
};

/**
 * Get timeframe progress percentage
 * @param {string} startDate - YYYY-MM-DD format
 * @param {string} endDate - YYYY-MM-DD format
 * @returns {number} - Percentage of time elapsed (0-100)
 */
export const getTimeframeProgress = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;

  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  const totalTime = end - start;
  const elapsed = now - start;

  if (totalTime <= 0) return 100;
  if (elapsed < 0) return 0;
  if (elapsed > totalTime) return 100;

  return Math.min(100, Math.max(0, (elapsed / totalTime) * 100));
};

/**
 * Get suggested next timeframe for recurring goals
 * @param {string} currentTimeframe
 * @param {string} currentEndDate - YYYY-MM-DD format
 * @returns {object} - { timeframe, startDate, endDate }
 */
export const getNextRecurringTimeframe = (currentTimeframe, currentEndDate) => {
  if (!currentEndDate) return null;

  const endDate = new Date(currentEndDate);

  switch (currentTimeframe) {
    case 'this_week': {
      const nextStart = new Date(endDate);
      nextStart.setDate(endDate.getDate() + 1);

      const nextEnd = new Date(nextStart);
      nextEnd.setDate(nextStart.getDate() + 6);

      return {
        timeframe: 'this_week',
        startDate: formatDate(nextStart),
        endDate: formatDate(nextEnd)
      };
    }

    case 'this_month': {
      const nextMonth = new Date(endDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(1);

      const nextMonthEnd = new Date(nextMonth);
      nextMonthEnd.setMonth(nextMonthEnd.getMonth() + 1);
      nextMonthEnd.setDate(0);

      return {
        timeframe: 'this_month',
        startDate: formatDate(nextMonth),
        endDate: formatDate(nextMonthEnd)
      };
    }

    case 'this_quarter': {
      const nextQuarter = new Date(endDate);
      nextQuarter.setMonth(nextQuarter.getMonth() + 3);
      nextQuarter.setDate(1);

      const nextQuarterEnd = new Date(nextQuarter);
      nextQuarterEnd.setMonth(nextQuarterEnd.getMonth() + 3);
      nextQuarterEnd.setDate(0);

      return {
        timeframe: 'this_quarter',
        startDate: formatDate(nextQuarter),
        endDate: formatDate(nextQuarterEnd)
      };
    }

    case 'this_year': {
      const nextYear = new Date(endDate.getFullYear() + 1, 0, 1);
      const nextYearEnd = new Date(endDate.getFullYear() + 1, 11, 31);

      return {
        timeframe: 'this_year',
        startDate: formatDate(nextYear),
        endDate: formatDate(nextYearEnd)
      };
    }

    default:
      return null;
  }
};

// Helper function to format date
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default {
  calculateTimeframeDates,
  getTimeframeDescription,
  calculateDaysRemaining,
  isTimeframeActive,
  getTimeframeProgress,
  getNextRecurringTimeframe
};
