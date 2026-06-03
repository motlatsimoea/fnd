import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

export const fetchFollowingFeed = createAsyncThunk(
  "followingFeed/fetchFollowingFeed",
  async () => {
    const response = await axiosInstance.get("/follow/feed/");
    return response.data;
  }
);

const followingFeedSlice = createSlice({
  name: "followingFeed",
  initialState: {
    loading: false,
    posts: [],
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFollowingFeed.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFollowingFeed.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchFollowingFeed.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default followingFeedSlice.reducer;