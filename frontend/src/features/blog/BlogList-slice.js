// blogSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Fetch all posts
export const fetchBlogPosts = createAsyncThunk('blogs/fetchBlogPosts', async () => {
  const response = await axios.get('/api/posts/');
  return response.data;
});

// fetch single post
export const fetchSinglePost = createAsyncThunk(
  'blogs/fetchSinglePost',
  async (postId, thunkAPI) => {
    const response = await axios.get(`/api/posts/${postId}/`);
    return response.data;
  }
);

// Create a new post
export const createPost = createAsyncThunk('blogs/createPost', async (postData, thunkAPI) => {
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const response = await axios.post('/api/posts/', postData, config);
  return response.data;
});

// Delete a post by ID
export const deletePost = createAsyncThunk('blogs/deletePost', async (postId, thunkAPI) => {
  await axios.delete(`/api/posts/${postId}/`);
  return postId; // Return the deleted ID to update state
});

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
      // Fetch
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
        state.error = action.error.message;
      })

      // Create
      .addCase(createPost.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts.unshift(action.payload); // Add the new post to the top
      })
      .addCase(createPost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })


      // Delete
      .addCase(deletePost.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        state.loading = false;
        state.posts = state.posts.filter(post => post.id !== action.payload);
      })
      .addCase(deletePost.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      });
  },
});

export default blogSlice.reducer;
