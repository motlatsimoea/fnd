import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from '../../utils/axiosInstance';  // ✅ use custom axiosInstance

// Fetch all reviews for a product
export const fetchReviews = createAsyncThunk(
  "reviews/fetchByProduct",
  async (productId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/products/${productId}/reviews/`); // ✅ changed
      return { productId, reviews: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to fetch reviews');
    }
  }
);

// Create a new review
export const createReview = createAsyncThunk(
  "reviews/create",
  async ({ productId, reviewData }, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/products/${productId}/reviews/`, reviewData); // ✅ changed
      return { productId, review: response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to create review');
    }
  }
);

// Update an existing review
export const updateReview = createAsyncThunk(
  "reviews/update",
  async ({ reviewId, updatedData }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/reviews/${reviewId}/`, updatedData); // ✅ changed
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data || 'Failed to update review');
    }
  }
);

const reviewsSlice = createSlice({
  name: "reviews",
  initialState: {
    reviewsByProduct: {},
    status: "idle",
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        const { productId, reviews } = action.payload;
        state.reviewsByProduct[productId] = reviews;
        state.status = "succeeded";
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        const { productId, review } = action.payload;
        if (!state.reviewsByProduct[productId]) {
          state.reviewsByProduct[productId] = [];
        }
        state.reviewsByProduct[productId].push(review);
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const updatedReview = action.payload;
        const productId = updatedReview.product; // assuming review includes product id
        const reviews = state.reviewsByProduct[productId] || [];
        const index = reviews.findIndex((r) => r.id === updatedReview.id);
        if (index !== -1) {
          reviews[index] = updatedReview;
        }
      });
  },
});

export default reviewsSlice.reducer;
