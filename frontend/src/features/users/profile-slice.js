import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// ─── Fetch Profile ───────────────────────────────
export const fetchProfile = createAsyncThunk(
  "profile/fetchProfile",
  async (username, { rejectWithValue }) => {
    try {
      // If username is provided, fetch that profile; otherwise fallback to current user
      const url = username
        ? `/api/users/profile/${username}/`
        : "/api/users/profile/";
      const response = await axiosInstance.get(url);
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to fetch profile");
    }
  }
);

// ─── Update Profile (with FormData) ──────────────
export const updateProfile = createAsyncThunk(
  "profile/updateProfile",
  async ({ username, formData }, { rejectWithValue }) => {
    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) data.append(key, value);
      });

      const url = username
        ? `/api/users/profile/${username}/`
        : "/api/users/profile/";

      const response = await axiosInstance.put(url, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return response.data;
    } catch (err) {
      return rejectWithValue(err.response?.data || "Failed to update profile");
    }
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState: { profile: null, loading: false, error: null },
  reducers: { clearProfileError: (state) => (state.error = null) },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearProfileError } = profileSlice.actions;
export default profileSlice.reducer;
