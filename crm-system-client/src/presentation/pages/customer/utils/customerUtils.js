// Type badge color mapping
export const getTypeColor = (type) => {
  const colors = {
    'Customer': 'success',
    'Prospect': 'warning',
    'Partner': 'info'
  };
  return colors[type] || 'default';
};
