import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

// ─── Async Thunks ─────────

// Fetch comments for a post
export const fetchComments = createAsyncThunk(
  'comments/fetchComments',
  async (postId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/api/posts/${postId}/comments/`);
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to fetch comments'
      );
    }
  }
);

// Create a new comment or reply
export const createComment = createAsyncThunk(
  'comments/createComment',
  async ({ postId, text, parent = null }, thunkAPI) => {
    try {
      const res = await axiosInstance.post(
        `/api/posts/${postId}/comments/`,
        { content: text, parent }
      );
      return res.data;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to create comment'
      );
    }
  }
);

// Edit a comment
export const editComment = createAsyncThunk(
  'comments/editComment',
  async ({ postId, commentId, text }, thunkAPI) => {
    try {
      const res = await axiosInstance.patch(
        `/api/posts/${postId}/comments/${commentId}/`,
        { content: text }
      );
      return { ...res.data, id: commentId };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to edit comment'
      );
    }
  }
);

// Delete a comment
export const deleteComment = createAsyncThunk(
  'comments/deleteComment',
  async ({ postId, commentId }, thunkAPI) => {
    try {
      await axiosInstance.delete(`/api/posts/${postId}/comments/${commentId}/`);
      return commentId;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.detail || 'Failed to delete comment'
      );
    }
  }
);

// ─── Helper Functions for Tree Management ─────────────────────

// Add comment (or reply) to tree
function addCommentToTree(tree, comment) {
  if (!comment.parent) {
    tree.push(comment);
    return true;
  }

  for (let node of tree) {
    if (node.id === comment.parent) {
      node.replies = node.replies || [];
      node.replies.push(comment);
      return true;
    } else if (node.replies?.length) {
      const added = addCommentToTree(node.replies, comment);
      if (added) return true;
    }
  }

  return false;
}

// Update comment in tree
function updateCommentInTree(tree, updated) {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === updated.id) {
      tree[i] = { ...tree[i], ...updated };
      return true;
    } else if (tree[i].replies?.length) {
      const found = updateCommentInTree(tree[i].replies, updated);
      if (found) return true;
    }
  }
  return false;
}

// Delete comment from tree
function deleteCommentFromTree(tree, commentId) {
  for (let i = 0; i < tree.length; i++) {
    if (tree[i].id === commentId) {
      tree.splice(i, 1);
      return true;
    } else if (tree[i].replies?.length) {
      const deleted = deleteCommentFromTree(tree[i].replies, commentId);
      if (deleted) return true;
    }
  }
  return false;
}

// ─── Slice Definition ───────

const commentsSlice = createSlice({
  name: 'comments',
  initialState: {
    items: [],       // nested comment tree
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder

      // ─── Fetch Comments ─────
      .addCase(fetchComments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchComments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchComments.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // ─── Create ─────
      .addCase(createComment.fulfilled, (state, action) => {
        addCommentToTree(state.items, action.payload);
      })

      // ─── Edit ─────
      .addCase(editComment.fulfilled, (state, action) => {
        updateCommentInTree(state.items, action.payload);
      })

      // ─── Delete ─────
      .addCase(deleteComment.fulfilled, (state, action) => {
        deleteCommentFromTree(state.items, action.payload);
      });
  },
});

export default commentsSlice.reducer;
