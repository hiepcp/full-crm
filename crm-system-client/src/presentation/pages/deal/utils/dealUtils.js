// Stage badge color mapping
export const getStageColor = (stage) => {
  const colors = {
    'Prospecting': 'info',
    'Quotation': 'secondary',
    'Negotiation': 'warning',
    'Closed Won': 'success',
    'Closed Lost': 'error'
  };
  return colors[stage] || 'default';
};
