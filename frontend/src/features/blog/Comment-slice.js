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
export const updateComment = createAsyncThunk(
  'comments/updateComment',
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

// ─── Helper Functions (Immutable) ─────────────────────

// Add comment (or reply) immutably
function addCommentToTree(tree, comment) {
  if (!comment.parent) {
    return [...tree, { ...comment, replies: [] }];
  }

  return tree.map((node) =>
    node.id === comment.parent
      ? {
          ...node,
          replies: [...(node.replies || []), { ...comment, replies: [] }],
        }
      : {
          ...node,
          replies: node.replies ? addCommentToTree(node.replies, comment) : [],
        }
  );
}

// Update comment immutably
function updateCommentInTree(tree, updated) {
  return tree.map((node) =>
    node.id === updated.id
      ? { ...node, ...updated }
      : { ...node, replies: node.replies ? updateCommentInTree(node.replies, updated) : [] }
  );
}

// Delete comment immutably (fix: recursive delete)
function deleteCommentFromTree(tree, commentId) {
  return tree
    .filter((node) => node.id !== commentId) // remove at this level
    .map((node) => ({
      ...node,
      replies: node.replies ? deleteCommentFromTree(node.replies, commentId) : [],
    }));
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
        state.items = addCommentToTree(state.items, action.payload);
      })

      // ─── Edit ─────
      .addCase(updateComment.fulfilled, (state, action) => {
        state.items = updateCommentInTree(state.items, action.payload);
      })

      // ─── Delete ─────
      .addCase(deleteComment.fulfilled, (state, action) => {
        state.items = deleteCommentFromTree(state.items, action.payload);
      });
  },
});

export default commentsSlice.reducer;
