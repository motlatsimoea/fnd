// features/users/auth-slice.js
import axios from 'axios';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { setAccessToken } from '../../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';

const initialState = {
  userInfo: null,
  access: null,
  loading: false,
  error: null,
  resetStatus: null,
};

/* =====================================================
   LOGIN
===================================================== */

export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post('/api/login/', {
        username,
        password,
      });

      if (data?.access) setAccessToken(data.access);

      return {
        access: data?.access ?? null,
        user: data?.user ?? null,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Invalid username or password'
      );
    }
  }
);

/* =====================================================
   PASSWORD RESET
===================================================== */

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (email, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('/password-reset/', { email });
      return data.detail;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Error sending reset link'
      );
    }
  }
);

export const resetPasswordConfirm = createAsyncThunk(
  'auth/resetPasswordConfirm',
  async ({ uid, token, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/password-reset-confirm/${uid}/${token}/`,
        { password }
      );
      return data.detail;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Error resetting password'
      );
    }
  }
);

/* =====================================================
   REFRESH TOKEN (SAFE VERSION)
===================================================== */

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue, getState }) => {
    const state = getState();


    try {
      const { data } = await axiosInstance.post(
        '/token/refresh/',
        {},
        { withCredentials: true }
      );

      const access = data?.access ?? data;

      if (access) setAccessToken(access);

      const { data: user } = await axiosInstance.get('/users/me/', {
        withCredentials: true,
      });

      return { access, user };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
          error.message ||
          'Session expired. Please log in again.'
      );
    }
  }
);

/* =====================================================
   REFRESH TIMER (SAFE VERSION)
===================================================== */

let refreshTimeout = null;

export const startTokenRefreshTimer = (dispatch, accessToken) => {
  // 🚨 Don't start timer if no session
  if (!accessToken || !sessionStorage.getItem('hasSession')) return;

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

        const newAccess = result?.access;
        if (newAccess) {
          startTokenRefreshTimer(dispatch, newAccess);
        }
      } catch {
        stopTokenRefreshTimer();
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

/* =====================================================
   SLICE
===================================================== */

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.userInfo = null;
      state.access = null;
      state.loading = false;
      state.error = null;

      stopTokenRefreshTimer();          // ✅ stop timer
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

      /* LOGIN */
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.userInfo = action.payload?.user || null;
        state.access = action.payload?.access || null;
        state.error = null;

        sessionStorage.setItem('hasSession', 'true');
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || 'Invalid username or password';
      })

      /* PASSWORD RESET */
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetStatus = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.loading = false;
        state.resetStatus = action.payload;
      })
      .addCase(requestPasswordReset.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* RESET CONFIRM */
      .addCase(resetPasswordConfirm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPasswordConfirm.fulfilled, (state, action) => {
        state.loading = false;
        state.resetStatus = action.payload;
      })
      .addCase(resetPasswordConfirm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* REFRESH */
      .addCase(refreshToken.fulfilled, (state, action) => {
        const { access, user } = action.payload || {};

        if (user) state.userInfo = user;
        if (access) state.access = access;

        state.error = null;
      })
      .addCase(refreshToken.rejected, (state, action) => {
        state.userInfo = null;
        state.access = null;
        state.error = action.payload;

        stopTokenRefreshTimer();   // ✅ STOP timer on failure
        sessionStorage.removeItem('hasSession');
      });
  },
});

export const { logout, setUser, clearError } = authSlice.actions;
export default authSlice.reducer;
