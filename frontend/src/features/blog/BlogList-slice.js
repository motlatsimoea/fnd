// src/features/blog/blogSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// ─── Async Thunks ─────────

// Fetch all posts
export const fetchBlogPosts = createAsyncThunk(
  'blogs/fetchBlogPosts',
  async () => {
    const response = await axiosInstance.get('/posts/');
    return response.data;
  }
);

// Fetch single post
export const fetchSinglePost = createAsyncThunk(
  'blogs/fetchSinglePost',
  async (postId, thunkAPI) => {
    try {
      const response = await axiosInstance.get(`/posts/${postId}/`);
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
      const response = await axiosInstance.post('/posts/create/', postData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to create post'
      );
    }
  }
);

// Edit Post
export const updatePost = createAsyncThunk(
  'blogs/updatePost',
  async ({ postId, formData }, thunkAPI) => {
    try {
      const response = await axiosInstance.put(`/posts/${postId}/`, formData);
      return response.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to update post'
      );
    }
  }
);

// Delete a post
export const deletePost = createAsyncThunk(
  'blogs/deletePost',
  async (postId, thunkAPI) => {
    try {
      await axiosInstance.delete(`/posts/${postId}/`);
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
      const response = await axiosInstance.post(`/posts/${postId}/like/`);
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
        state.posts = action.payload.map(post => ({
          ...post,
          liked: post.is_liked,   // normalize
        }));
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
        state.singlePost = {
          ...action.payload,
          liked: action.payload.is_liked, // normalize
        };
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
      // Update post
      .addCase(updatePost.pending, (state) => {
        state.loading = true;
      })

      .addCase(updatePost.fulfilled, (state, action) => {
        state.loading = false;

        const updatedPost = {
          ...action.payload,
          liked: action.payload.is_liked,
        };

        // Update single post
        if (state.singlePost?.id === updatedPost.id) {
          state.singlePost = updatedPost;
        }

        // Update in feed
        const index = state.posts.findIndex(p => p.id === updatedPost.id);
        if (index !== -1) {
          state.posts[index] = updatedPost;
        }
      })

      .addCase(updatePost.rejected, (state, action) => {
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
      .addCase(toggleLikePost.pending, (state, action) => {
          const postId = action.meta.arg;

          // Update single post immediately
          if (state.singlePost?.id === postId) {
            state.singlePost.liked = !state.singlePost.liked;
            state.singlePost.like_count += state.singlePost.liked ? 1 : -1;
          }

          // Update feed immediately
          const post = state.posts.find((p) => p.id === postId);
          if (post) {
            post.liked = !post.liked;
            post.like_count += post.liked ? 1 : -1;
          }
        })

      .addCase(toggleLikePost.fulfilled, (state, action) => {
        const { postId, liked, like_count } = action.payload;

        // Update single post page
        if (state.singlePost?.id === postId) {
          state.singlePost.liked = liked;
          state.singlePost.like_count = like_count;
        }

        // Update post in feed
        const post = state.posts.find((p) => p.id === postId);
        if (post) {
          post.liked = liked;
          post.like_count = like_count;
        }
      })

  },
});

export default blogSlice.reducer;
