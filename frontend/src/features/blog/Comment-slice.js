import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const baseUrl = '/api/posts';

export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (postId, thunkAPI) => {
    const res = await axios.get(`${baseUrl}/${postId}/comments/`);
    return res.data;
  }
);

export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ postId, text, parent = null }, thunkAPI) => {
    const res = await axios.post(`${baseUrl}/${postId}/comments/`, {
      text,
      parent
    });
    return res.data;
  }
);

export const editComment = createAsyncThunk(
  'comments/editComment',
  async ({ postId, commentId, text }, thunkAPI) => {
    const res = await axios.put(`${baseUrl}/${postId}/comments/${commentId}/`, {
      text
    });
    return { ...res.data, id: commentId };
  }
);

export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ postId, commentId }, thunkAPI) => {
    await axios.delete(`${baseUrl}/${postId}/comments/${commentId}/`);
    return commentId;
  }
);

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    items: [],
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchComments.pending, state => {
        state.loading = true;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(createComment.fulfilled, (state, action) => {
        state.items.push(action.payload);
      })

      .addCase(editComment.fulfilled, (state, action) => {
        const index = state.items.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })

      .addCase(deleteComment.fulfilled, (state, action) => {
        state.items = state.items.filter(c => c.id !== action.payload);
      });
  }
});

export default commentsSlice.reducer;
