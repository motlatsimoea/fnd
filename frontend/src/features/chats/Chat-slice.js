// src/redux/chatSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Axios base URL config (update if needed)
axios.defaults.baseURL = 'http://localhost:8000/api/chats'; // adjust if you're using a different port or proxy

// === THUNKS ===

// Fetch all chat rooms for the logged-in user
export const fetchUserChats = createAsyncThunk(
  'chats/fetchUserChats',
  async (_, thunkAPI) => {
    try {
      const res = await axios.get('/');
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

// Fetch messages for a specific chat
export const fetchMessages = createAsyncThunk(
  'chats/fetchMessages',
  async (chatId, thunkAPI) => {
    try {
      const res = await axios.get(`/${chatId}/`);
      return { chatId, messages: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

// Create or join a chat and send a message
export const createChatAndSendMessage = createAsyncThunk(
  'chats/createChatAndSendMessage',
  async ({ recipientId, message }, thunkAPI) => {
    try {
      const res = await axios.post(`/create-chat/${recipientId}/`, {
        message,
      });
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

// Send a message to an existing chat
export const sendMessage = createAsyncThunk(
  'chats/sendMessage',
  async ({ chatId, message }, thunkAPI) => {
    try {
      const res = await axios.post(`/${chatId}/messages/`, {
        content: message,
      });
      return { chatId, message: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data);
    }
  }
);

// === SLICE ===

const chatSlice = createSlice({
  name: 'chats',
  initialState: {
    chatRooms: [],
    messages: {}, // { chatId: [messages] }
    loading: false,
    error: null,
  },
  reducers: {
    // WebSocket or realtime update
    receiveNewMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) state.messages[chatId] = [];
      state.messages[chatId].push(message);
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUserChats
      .addCase(fetchUserChats.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chatRooms = action.payload;
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // fetchMessages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        state.messages[action.payload.chatId] = action.payload.messages;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // createChatAndSendMessage
      .addCase(createChatAndSendMessage.pending, (state) => {
        state.loading = true;
      })
      .addCase(createChatAndSendMessage.fulfilled, (state, action) => {
        state.loading = false;
        // Optional: refetch chat list
      })
      .addCase(createChatAndSendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // sendMessage
      .addCase(sendMessage.fulfilled, (state, action) => {
        const { chatId, message } = action.payload;
        if (!state.messages[chatId]) state.messages[chatId] = [];
        state.messages[chatId].push(message);
      });
  },
});

export const { receiveNewMessage } = chatSlice.actions;
export default chatSlice.reducer;
