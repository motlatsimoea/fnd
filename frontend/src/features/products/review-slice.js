// reviewsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "../../api/axios";

// Fetch all reviews for a product
export const fetchReviews = createAsyncThunk(
  "reviews/fetchByProduct",
  async (productId) => {
    const response = await axios.get(`/products/${productId}/reviews/`);
    return { productId, reviews: response.data };
  }
);

// Create a new review
export const createReview = createAsyncThunk(
  "reviews/create",
  async ({ productId, reviewData }) => {
    const response = await axios.post(`/products/${productId}/reviews/`, reviewData);
    return { productId, review: response.data };
  }
);

// Update an existing review
export const updateReview = createAsyncThunk(
  "reviews/update",
  async ({ reviewId, updatedData }) => {
    const response = await axios.put(`/reviews/${reviewId}/`, updatedData);
    return response.data;
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
        .addCase(fetchReviews.fulfilled, (state, action) => {
          const { productId, reviews } = action.payload;
          state.reviewsByProduct[productId] = reviews;
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
          const productId = updatedReview.product; // assuming review includes this
          const reviews = state.reviewsByProduct[productId] || [];
          const index = reviews.findIndex(r => r.id === updatedReview.id);
          if (index !== -1) {
            reviews[index] = updatedReview;
          }
        });
    }
  });
  
  export default reviewsSlice.reducer;
  