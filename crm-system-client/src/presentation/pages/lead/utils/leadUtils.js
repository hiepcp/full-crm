// Status badge color mapping
export const getStatusColor = (status) => {
  const colors = {
    working: 'warning',
    qualified: 'success',
    unqualified: 'error',
    cancelled: 'error'
  };
  return colors[status] || 'default';
};

// Source badge color mapping
export const getSourceColor = (source) => {
  const colors = {
    web: 'info',
    event: 'error',
    referral: 'success',
    ads: 'warning',
    facebook: 'primary',
    other: 'default'
  };
  return colors[source] || 'default';
};

// Score color mapping based on score ranges
export const getScoreColor = (score) => {
  const numScore = Number(score) || 0;
  if (numScore >= 71) return 'success'; // High score - green
  if (numScore >= 31) return 'warning'; // Medium score - orange
  return 'error'; // Low score - red
};

