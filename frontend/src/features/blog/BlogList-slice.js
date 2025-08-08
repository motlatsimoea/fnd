// src/features/blog/blogSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance'; 

// Fetch all posts (no auth required)
export const fetchBlogPosts = createAsyncThunk('blogs/fetchBlogPosts', async () => {
  const response = await axiosInstance.get('/api/posts/');
  return response.data;
});

// Fetch single post (auth required)
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

// Create a new post (auth required)
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

// Delete a post by ID (auth required)
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

const blogSlice = createSlice({
  name: 'blogs',
  initialState: {
    posts: [],
    singlePost: null,
    loading: false,
    error: null,
  },
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
        state.posts = state.posts.filter(post => post.id !== action.payload);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      });
  },
});

export default blogSlice.reducer;
