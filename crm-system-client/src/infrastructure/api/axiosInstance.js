
import axios from 'axios';
import config from '@src/config';
import { tokenHelper } from '@utils/tokenHelper';

let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(token) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

const axiosInstance = axios.create({
  baseURL: config.API_URL,
  headers: {
    'Content-Type': 'application/json',
    'XApiKey': config.x_api_key
  }
});

// Request interceptor
axiosInstance.interceptors.request.use(
  async (conf) => {
    // Check token expiration and refresh if needed
    if (tokenHelper.isTokenExpired() && !conf.url.endsWith('/refresh')) {
      if (!isRefreshing) {
        isRefreshing = true;
        try {
          const resp = await axiosInstance.post(
            '/refresh',
            {},
            {
              baseURL: config.API_AUTH,
              withCredentials: true,
            }
          );
          const { access_token, expires_in } = resp.data;
          if (access_token && expires_in) {
            localStorage.setItem('accessToken', access_token);
            // expires_in is usually seconds, store as timestamp in ms
            const expiresAt = Date.now() + parseInt(expires_in, 10) * 1000;
            localStorage.setItem('expiresIn', expiresAt.toString());
            onRefreshed(access_token);
          }
        } catch (e) {
          console.error('Error refreshing token:', e);
          localStorage.clear();
          //window.location.href = '/login';
          return Promise.reject(e);
        } finally {
          isRefreshing = false;
        }
      }
      // Wait for refresh to finish
      return new Promise((resolve) => {
        addRefreshSubscriber((token) => {
          if (token) conf.headers['Authorization'] = `Bearer ${token}`;
          resolve(conf);
        });
      });
    }
    const token = tokenHelper.get();
    if (token) conf.headers['Authorization'] = `Bearer ${token}`;
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


// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401].includes(error.response.status)) {      
      localStorage.clear();
      window.location.href = '/login';
    }
    if (error.response && [403].includes(error.response.status)) {      
      window.location.href = '/unauthorized';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
