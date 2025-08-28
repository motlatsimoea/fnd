// features/users/auth-slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { setAccessToken } from '../../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';

const initialState = {
  userInfo: null,
  loading: false,
  error: null,
};

// --- LOGIN ---
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const config = { headers: { 'Content-Type': 'application/json' } };
      const { data } = await axiosInstance.post('/login/', { username, password }, config);

      if (data?.access) setAccessToken(data.access);

      return {
        access: data?.access ?? null,
        user: data?.user ?? null,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// --- REFRESH ---
export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      // 1️⃣ Refresh access token
      const { data: refreshData } = await axiosInstance.post('/token/refresh/');
      const access = refreshData?.access ?? refreshData;
      if (access) setAccessToken(access);

      // 2️⃣ Fetch current user immediately after refresh
      const { data: user } = await axiosInstance.get('/api/users/me/');

      return { access, user };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Session expired. Please log in again.'
      );
    }
  }
);

// --- REFRESH TIMER ---
let refreshTimeout = null;
export const startTokenRefreshTimer = (dispatch, accessToken) => {
  if (!accessToken) return;

  try {
    const { exp } = jwtDecode(accessToken);
    const expiryTime = exp * 1000;
    const now = Date.now();
    const timeout = expiryTime - now - 30000; // refresh 30s early

    if (timeout <= 0) {
      dispatch(refreshToken());
      return;
    }

    refreshTimeout = setTimeout(async () => {
      try {
        const result = await dispatch(refreshToken()).unwrap();
        const newAccess = result?.access ?? result;
        startTokenRefreshTimer(dispatch, newAccess);
      } catch {
        stopTokenRefreshTimer();
        console.error('Auto refresh failed.');
      }
    }, timeout);
  } catch (err) {
    console.error('Failed to decode access token', err);
  }
};

export const stopTokenRefreshTimer = () => {
  if (refreshTimeout) {
    clearTimeout(refreshTimeout);
    refreshTimeout = null;
  }
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.loading = false;
      state.error = null;
      stopTokenRefreshTimer();
      sessionStorage.removeItem('hasSession');
    },
    setUser: (state, action) => {
      state.userInfo = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- LOGIN ---
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload?.user || null;
        state.error = null;
        sessionStorage.setItem('hasSession', 'true');
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.detail || action.payload || 'Login failed';
      })

      // --- REFRESH ---
      .addCase(refreshToken.fulfilled, (state, action) => {
        const { user } = action.payload || {};
        if (user) state.userInfo = user;
        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.userInfo = null;
        state.error = action.payload;
      });
  },
});

export const { logout, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
