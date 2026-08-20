import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

export const searchAll = createAsyncThunk(
  "search/searchAll",
  async (query, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        `/search/?q=${encodeURIComponent(query)}`
      );

      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.detail ||
        "Search failed"
      );
    }
  }
);

const initialState = {
  results: {
    users: [],
    hashtags: [],
    posts: [],
  },
  loading: false,
  error: null,
};

const searchSlice = createSlice({
  name: "search",
  initialState,

  reducers: {
    clearSearchResults: (state) => {
      state.results = {
        users: [],
        hashtags: [],
        posts: [],
      };
      state.error = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(searchAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })

      .addCase(searchAll.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })

      .addCase(searchAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearSearchResults
} = searchSlice.actions;

export default searchSlice.reducer;