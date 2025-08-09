import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

const getErrorMessage = (error) =>
  error.response?.data?.detail || error.response?.data || error.message || "Something went wrong";

// Fetch all reviews for a product
export const fetchReviews = createAsyncThunk(
  "reviews/fetchByProduct",
  async (productId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/products/${productId}/reviews/`);
      return { productId, reviews: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
  }
);

// Create review
export const createReview = createAsyncThunk(
  "reviews/create",
  async ({ productId, reviewData }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(`/products/${productId}/reviews/`, reviewData);
      return { productId, review: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
  }
);

// Update review
export const updateReview = createAsyncThunk(
  "reviews/update",
  async ({ reviewId, updatedData }, thunkAPI) => {
    try {
      const res = await axiosInstance.put(`/reviews/${reviewId}/`, updatedData);
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(getErrorMessage(err));
    }
  }
);

const reviewsSlice = createSlice({
  name: "reviews",
  initialState: {
    reviewsByProduct: {},
    fetchStatus: "idle",
    createStatus: "idle",
    updateStatus: "idle",
    error: null,
  },
  reducers: {
    clearReviewError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // FETCH
      .addCase(fetchReviews.pending, (state) => {
        state.fetchStatus = "loading";
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        const { productId, reviews } = action.payload;
        state.reviewsByProduct[productId] = reviews;
        state.fetchStatus = "succeeded";
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.fetchStatus = "failed";
        state.error = action.payload;
      })

      // CREATE
      .addCase(createReview.pending, (state) => {
        state.createStatus = "loading";
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        const { productId, review } = action.payload;
        if (!state.reviewsByProduct[productId]) {
          state.reviewsByProduct[productId] = [];
        }
        state.reviewsByProduct[productId] = [...state.reviewsByProduct[productId], review];
        state.createStatus = "succeeded";
      })
      .addCase(createReview.rejected, (state, action) => {
        state.createStatus = "failed";
        state.error = action.payload;
      })

      // UPDATE
      .addCase(updateReview.pending, (state) => {
        state.updateStatus = "loading";
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const updatedReview = action.payload;
        const productId = updatedReview.product;
        const reviews = state.reviewsByProduct[productId] || [];
        state.reviewsByProduct[productId] = reviews.map((r) =>
          r.id === updatedReview.id ? updatedReview : r
        );
        state.updateStatus = "succeeded";
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.updateStatus = "failed";
        state.error = action.payload;
      });
  },
});

export const { clearReviewError } = reviewsSlice.actions;
export default reviewsSlice.reducer;
