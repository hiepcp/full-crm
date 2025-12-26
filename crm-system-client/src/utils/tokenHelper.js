export const tokenHelper = {
  get: () => localStorage.getItem('accessToken'),
  set: (t) => localStorage.setItem('accessToken', t),
  clear: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('expiresIn');
    localStorage.removeItem('accessTokenEmail');
    localStorage.removeItem('expiresInEmail');
    localStorage.removeItem('connectedEmail');
  },

  isTokenExpired: () => {
    const expiresIn = localStorage.getItem('expiresIn');
    if (!expiresIn) return false;
    // expiresIn is usually in seconds, store timestamp in ms
    const expiresAt = parseInt(expiresIn, 10);
    // If expiresIn is a timestamp (ms), check if it's in the past
    return Date.now() > expiresAt;
  },
  
  /**
   * Decode JWT accessToken from localStorage and extract email or preferred_username
   * @returns {string|null}
   */
  getEmailFromToken: () => {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      return payload.email || payload.preferred_username || null;
    } catch {
      return null;
    }
  }
}