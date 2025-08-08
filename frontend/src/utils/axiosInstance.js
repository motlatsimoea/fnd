import axios from 'axios';

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token;
};

const axiosInstance = axios.create({
  withCredentials: true, // Send cookies
});

// Attach Authorization header
axiosInstance.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  return config;
});

// Handle 401 errors and refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Lazy import store and slice
        const { store } = await import('../store');
        const { refreshToken } = await import('../features/users/auth-slice');

        // 🛡️ Guard clause: if user is not logged in, skip refresh
        const state = store.getState();
        if (!state.auth.userInfo) {
          return Promise.reject(error); // Don't refresh if user not logged in
        }

        const result = await store.dispatch(refreshToken()).unwrap();

        if (result?.access) {
          setAccessToken(result.access);
          originalRequest.headers['Authorization'] = `Bearer ${result.access}`;
          return axiosInstance(originalRequest); // Retry
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
