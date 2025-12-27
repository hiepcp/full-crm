import dayjs from 'dayjs';

/**
 * Định dạng ngày giờ theo format chuẩn (ví dụ: 'DD/MM/YYYY HH:mm:ss')
 * @param {string|number|Date} date - Chuỗi, timestamp, hoặc đối tượng Date
 * @param {string} format - Định dạng mong muốn (mặc định: 'DD/MM/YYYY HH:mm:ss')
 * @returns {string} Chuỗi ngày giờ đã định dạng
 */
export function formatDateTime(date, format = 'DD/MM/YYYY HH:mm') {
  if (!date || date === '0001-01-01T00:00:00') return '';
  return dayjs(date).isValid() ? dayjs(date).format(format) : '';
}