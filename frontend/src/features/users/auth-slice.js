// features/users/auth-slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance, { setAccessToken } from '../../utils/axiosInstance';
import { jwtDecode } from 'jwt-decode';

const initialState = {
  userInfo: null,
  access: null,
  loading: false,
  error: null,
  resetStatus: null,
  otpVerified: false,
};

/* =====================================================
   LOGIN
===================================================== */

export const login = createAsyncThunk(
    'auth/login',
    async ({ username, password }, { rejectWithValue }) => {
        try {
            const { data } = await axiosInstance.post(
                '/login/',
                {
                    username,
                    password,
                }
            );

            if (data?.access) {
                setAccessToken(data.access);
            }

            return {
                access: data?.access ?? null,
                user: data?.user ?? null,
            };

        } catch (error) {
            return rejectWithValue(
                error.response?.data?.detail ||
                'Invalid username or password'
            );
        }
    }
);

/* =====================================================
   PASSWORD RESET
===================================================== */

export const requestPasswordReset = createAsyncThunk(
  'auth/requestPasswordReset',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post('password-reset/', payload);

      return {
        detail: data.detail,
        channel: data.channel,
        user_id: data.user_id,
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || 'Error sending reset instructions'
      );
    }
  }
);


export const resetPasswordConfirm = createAsyncThunk(
  "auth/resetPasswordConfirm",
  async ({ uid, token, password, confirm_password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        `/password-reset-confirm/${uid}/${token}/`,
        {
          password,
          confirm_password,
        }
      );

      return data.detail;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Error resetting password"
      );
    }
  }
);

export const resetPasswordPhoneConfirm = createAsyncThunk(
  "auth/resetPasswordPhoneConfirm",
  async ({ user_id, code, password }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        "password-reset-phone-confirm/",
        {
          user_id,
          code,
          password,
        }
      );

      return data.detail;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail || "Error resetting password"
      );
    }
  }
);


export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (
    { current_password, new_password, confirm_password },
    { rejectWithValue }
  ) => {
    try {
      const { data } = await axiosInstance.post("/change-password/", {
        current_password,
        new_password,
        confirm_password,
      });

      return data;
    } catch (error) {
      const detail = error.response?.data?.detail;

      return rejectWithValue(
        Array.isArray(detail)
          ? detail.join(" ")
          : detail || "Password change failed"
      );
    }
  }
);

/* =====================================================
   ACCOUNT DEACTIVATION AND DELETION
===================================================== */

export const deactivateAccount = createAsyncThunk(
  'auth/deactivateAccount',
  async (password, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        '/deactivate-account/',
        {
          password,
        }
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
        error.response?.data?.error ||
        'Account deactivation failed'
      );
    }
  }
);


export const deleteAccount = createAsyncThunk(
  'auth/deleteAccount',
  async (password, { rejectWithValue }) => {
    try {
      await axiosInstance.delete('/delete-account/', {
        data: { password },
      });
      return;
    } catch (error) {
      return rejectWithValue(error.response?.data?.detail);
    }
  }
);

/* =====================================================
   OTP VERIFICATION
===================================================== */

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ user_id, code }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
          '/users/verify-otp/',
          {
              user_id,
              code,
          }
      );

      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error || 'OTP verification failed'
      );
    }
  }
);

/* =====================================================
   REFRESH TOKEN (SAFE VERSION)
===================================================== */

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        '/token/refresh/'
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
  if (!accessToken || !sessionStorage.getItem('hasSession')) return;

  try {
    const { exp } = jwtDecode(accessToken);
    const expiryTime = exp * 1000;
    const now = Date.now();
    const timeout = expiryTime - now - 30000;

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
      state.otpVerified = false;

      stopTokenRefreshTimer();
      sessionStorage.removeItem('hasSession');
      sessionStorage.removeItem('pending_user_id');
    },

    setUser: (state, action) => {
      state.userInfo = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    clearResetStatus: (state) => {
      state.resetStatus = null;
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
        state.error = action.payload || 'Invalid username or password';
      })

      /* PASSWORD RESET */
      .addCase(requestPasswordReset.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.resetStatus = null;
      })
      .addCase(requestPasswordReset.fulfilled, (state, action) => {
        state.loading = false;
        state.resetStatus = action.payload.detail;
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

      .addCase(resetPasswordPhoneConfirm.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPasswordPhoneConfirm.fulfilled, (state, action) => {
        state.loading = false;
        state.resetStatus = action.payload;
      })
      .addCase(resetPasswordPhoneConfirm.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* CHANGE PASSWORD */
      .addCase(changePassword.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      /* ACCOUNT DEACTIVATION */
      .addCase(deactivateAccount.fulfilled, (state) => {
        state.userInfo = null;
        state.access = null;
      })

      /* ACCOUNT DELETION */
      .addCase(deleteAccount.fulfilled, (state) => {
        state.userInfo = null;
        state.access = null;
      })

      /* OTP VERIFY */
      .addCase(verifyOTP.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state) => {
        state.loading = false;
        state.otpVerified = true;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
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

        stopTokenRefreshTimer();
        sessionStorage.removeItem('hasSession');
      });
  },
});

export const {
  logout,
  setUser,
  clearError,
  clearResetStatus,
} = authSlice.actions;

export default authSlice.reducer;