import axios from 'axios';
import config from '@src/config';

/**
 * Public Axios Instance - for unauthenticated API calls
 * Does not require token and won't redirect to login on 401
 */
const publicAxiosInstance = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
    'XApiKey': config.x_api_key
  }
});

// Request interceptor - no token needed
publicAxiosInstance.interceptors.request.use(
  (conf) => {
    conf.headers['XApiKey'] = config.x_api_key;

    if (conf.data instanceof FormData) {
      conf.headers['Content-Type'] = 'multipart/form-data';
    }

    if (conf.data instanceof Blob) {
      conf.responseType = 'blob';
    }

    return conf;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - no redirect on 401
publicAxiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // For public APIs, just reject without redirecting
    // Let the component handle the error
    return Promise.reject(error);
  }
);

export default publicAxiosInstance;
