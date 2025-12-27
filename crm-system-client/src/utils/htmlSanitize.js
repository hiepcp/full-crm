/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes dangerous tags and attributes while preserving basic formatting
 * @param {string} html - The HTML content to sanitize
 * @returns {string} - The sanitized HTML content
 */
export const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') {
    return '';
  }

  // Create a temporary DOM element to parse the HTML
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Remove dangerous elements
  const dangerousElements = ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link'];
  dangerousElements.forEach(tag => {
    const elements = tempDiv.querySelectorAll(tag);
    elements.forEach(element => element.remove());
  });

  // Remove dangerous attributes
  const dangerousAttributes = ['onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown', 'onkeyup', 'onkeypress', 'onchange', 'onsubmit', 'onreset', 'onfocus', 'onblur'];
  const allElements = tempDiv.querySelectorAll('*');
  allElements.forEach(element => {
    dangerousAttributes.forEach(attr => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });

    // Remove javascript: URLs
    ['href', 'src', 'action'].forEach(attr => {
      if (element.hasAttribute(attr)) {
        const value = element.getAttribute(attr);
        if (value && value.toLowerCase().startsWith('javascript:')) {
          element.removeAttribute(attr);
        }
      }
    });
  });

  return tempDiv.innerHTML;
};
