// features/users/auth-slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { setAccessToken } from '../../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode'; // default import

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

      if (data?.access) {
        setAccessToken(data.access);
      }

      return {
        user: data?.user || null,
        access: data?.access || null,
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
      const { data } = await axiosInstance.post('/token/refresh/');

      // handle both shapes: if backend returns { access, user } or just { access }
      // ensure we write access into memory
      const access = data?.access ?? data; // if backend returns string, data is access
      if (access) setAccessToken(access);

      // Return consistent shape: { access, user? }
      return {
        access: access,
        user: data?.user ?? null,
      };
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
    const timeout = expiryTime - now - 30000; // refresh 30 seconds early

    if (timeout <= 0) {
      dispatch(refreshToken());
      return;
    }

    refreshTimeout = setTimeout(async () => {
      try {
        const result = await dispatch(refreshToken()).unwrap();
        // result is { access, user? } now
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
    // existing logout action
    logout: (state) => {
      state.userInfo = null;
      state.loading = false;
      state.error = null;
      stopTokenRefreshTimer();

      sessionStorage.removeItem('hasSession');
      // Note: server logout (blacklist + clear cookie) should be triggered by a component/API call
    },

    // ADD setUser so App bootstrap can populate user metadata
    setUser: (state, action) => {
      state.userInfo = action.payload;
    },

    // optional: a clearError helper
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // --- LOGIN FLOW ---
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

      // --- REFRESH FLOW ---
      .addCase(refreshToken.fulfilled, (state, action) => {
        // action.payload is { access, user? }
        // optionally update userInfo if backend supplied it
        const payload = action.payload || {};
        if (payload.user) {
          state.userInfo = payload.user;
        }
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
