// utils/axiosInstance.js
import axios from 'axios';

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const axiosInstance = axios.create({
  withCredentials: true, // Send cookies with every request
});

// ✅ Public endpoints that don't need Authorization
const PUBLIC_ENDPOINTS = [
  '/login/',
  '/password-reset/',
  '/password-reset-confirm/',
  '/register/',
];

// ✅ Request interceptor
axiosInstance.interceptors.request.use((config) => {
  const isPublic = PUBLIC_ENDPOINTS.some((url) => config.url.includes(url));

  if (!isPublic && accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  } else {
    delete config.headers['Authorization']; // ensure none is sent
  }

  return config;
});

// ✅ Response interceptor (handle refresh)
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const { store } = await import('../store');
        const { refreshToken } = await import('../features/users/auth-slice');

        const result = await store.dispatch(refreshToken()).unwrap();

        if (result?.access) {
          setAccessToken(result.access);
          originalRequest.headers['Authorization'] = `Bearer ${result.access}`;
          return axiosInstance(originalRequest);
        }
      } catch (e) {
        const { store } = await import('../store');
        const { logout } = await import('../features/users/auth-slice');
        store.dispatch(logout());
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
