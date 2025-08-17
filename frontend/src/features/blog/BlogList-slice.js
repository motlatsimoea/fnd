// src/features/blog/blogSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// ─── Async Thunks ─────────

// Fetch all posts
export const fetchBlogPosts = createAsyncThunk(
  'blogs/fetchBlogPosts',
  async () => {
    const response = await axiosInstance.get('/api/posts/');
    return response.data;
  }
);

// Fetch single post
export const fetchSinglePost = createAsyncThunk(
  'blogs/fetchSinglePost',
  async (postId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/api/posts/${postId}/`);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch post'
      );
    }
  }
);

// Create a new post
export const createPost = createAsyncThunk(
  'blogs/createPost',
  async (postData, thunkAPI) => {
    try {
      const response = await axiosInstance.post('/api/posts/create/', postData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to create post'
      );
    }
  }
);

// Delete a post
export const deletePost = createAsyncThunk(
  'blogs/deletePost',
  async (postId, thunkAPI) => {
    try {
      await axiosInstance.delete(`/api/posts/${postId}/`);
      return postId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to delete post'
      );
    }
  }
);

// Toggle like/unlike a post
export const toggleLikePost = createAsyncThunk(
  'blogs/toggleLikePost',
  async (postId, thunkAPI) => {
    try {
      const response = await axiosInstance.post(`/api/posts/${postId}/like/`);
      // backend returns { liked: true/false, like_count: number }
      return { postId, ...response.data };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to toggle like'
      );
    }
  }
);

// ─── Slice Definition ───────
const blogSlice = createSlice({
  name: 'BlogList',
  initialState: {
    posts: [],
    singlePost: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch all posts
      .addCase(fetchBlogPosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogPosts.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = action.payload;
      })
      .addCase(fetchBlogPosts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Fetch single post
      .addCase(fetchSinglePost.pending, (state) => {
        state.loading = true;
        state.singlePost = null;
        state.error = null;
      })
      .addCase(fetchSinglePost.fulfilled, (state, action) => {
        state.loading = false;
        state.singlePost = action.payload;
      })
      .addCase(fetchSinglePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Create post
      .addCase(createPost.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.unshift(action.payload);
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Delete post
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = state.posts.filter((post) => post.id !== action.payload);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })

      // Toggle like/unlike
      .addCase(toggleLikePost.fulfilled, (state, action) => {
        const { postId, liked, like_count } = action.payload;

        // Update singlePost if currently viewing it
        if (state.singlePost && state.singlePost.id === postId) {
          state.singlePost.liked = liked;
          state.singlePost.like_count = like_count;
        }

        // Update posts list for HomeScreen
        const postIndex = state.posts.findIndex((p) => p.id === postId);
        if (postIndex !== -1) {
          state.posts[postIndex].liked = liked;
          state.posts[postIndex].like_count = like_count;
        }
      });
  },
});

export default blogSlice.reducer;
