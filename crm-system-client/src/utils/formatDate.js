// Format date
export const formatDate = (dateString) => {
  if (!dateString || dateString === '0001-01-01T00:00:00') return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};
