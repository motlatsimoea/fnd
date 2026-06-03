import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";


export const toggleFollow = createAsyncThunk(
  "follow/toggleFollow",
  async (username) => {

    const response = await axiosInstance.post(`/follow/${username}/`);

    return {
      username,
      status: response.data.status
    };
  }
);


export const fetchFollowers = createAsyncThunk(
  "follow/fetchFollowers",
  async (username) => {

    const response = await axiosInstance.get(`/followers/${username}/`);

    return response.data;
  }
);


export const fetchFollowing = createAsyncThunk(
  "follow/fetchFollowing",
  async (username) => {

    const response = await axiosInstance.get(`/following/${username}/`);

    return response.data;
  }
);


const followSlice = createSlice({
  name: "follow",

  initialState: {
    followers: [],
    following: [],
    loading: false
  },

  reducers: {},

  extraReducers: (builder) => {

    builder
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        state.followers = action.payload;
      })

      .addCase(fetchFollowing.fulfilled, (state, action) => {
        state.following = action.payload;
      });

  }
});

export default followSlice.reducer;