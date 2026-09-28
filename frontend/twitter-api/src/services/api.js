import axios from "axios";
import { clearSession, getSessionToken } from './session'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Request interceptor to add JWT token to headers
api.interceptors.request.use(
  (config) => {
    const token = getSessionToken();
    const isPublicAuth = ['/auth/login', '/users/register'].includes(config.url)
    if (token && !isPublicAuth) {
      config.sessionToken = token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(response => response, error => {
  if (error.response?.status === 401 && error.config?.sessionToken) {
    clearSession(error.config.sessionToken)
  }
  return Promise.reject(error)
})

export default api;
