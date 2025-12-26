import axios from 'axios';
import config from '@src/config';
import { tokenHelper } from '@utils/tokenHelper';

const menuAxiosInstance = axios.create({
  baseURL: config.API_AUTHZ,
  headers: {
    'Content-Type': 'application/json',
    'XApiKey': config.x_api_key
  }
});

// Thêm interceptor để tự động gắn Authorization
menuAxiosInstance.interceptors.request.use(
  (conf) => {
    const token = tokenHelper.get();
    if (token) {
      conf.headers['Authorization'] = `Bearer ${token}`;      
    }
    return conf;
  },
  (error) => Promise.reject(error)
);

export default menuAxiosInstance;