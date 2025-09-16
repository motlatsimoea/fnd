import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

// === ASYNC THUNKS ===
export const fetchUserChats = createAsyncThunk(
  "chats/fetchUserChats",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/api/inbox/");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chats/fetchMessages",
  async (chatId, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/api/inbox/${chatId}/messages/`);
      return { chatId, messages: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

const chatSlice = createSlice({
  name: "chats",
  initialState: {
    chatRooms: [],
    messages: {}, // { chatId: [msg, msg, ...] }
    loading: false,
    error: null,
  },
  reducers: {
    // Add or receive one message (optimistic or server)
    receiveNewMessage: (state, action) => {
      const { chatId, message } = action.payload;
      if (!state.messages[chatId]) state.messages[chatId] = [];

      const msgWithSending =
        message.sending === undefined ? { ...message, sending: true } : message;

      if (!state.messages[chatId].some((m) => m.id === msgWithSending.id)) {
        state.messages[chatId].push(msgWithSending);
      }
    },

    // Replace a temp message with server-confirmed message
    updateMessageId: (state, action) => {
      const { chatId, tempId, newMessage } = action.payload;
      if (!state.messages[chatId]) state.messages[chatId] = [];

      const index = state.messages[chatId].findIndex((m) => m.id === tempId);
      const messageToInsert = { ...newMessage, sending: false };

      if (index !== -1) {
        state.messages[chatId][index] = messageToInsert;
      } else {
        state.messages[chatId].push(messageToInsert);
      }

      // Deduplicate & sort
      const unique = state.messages[chatId].filter(
        (msg, idx, self) => idx === self.findIndex((m) => m.id === msg.id)
      );
      state.messages[chatId] = unique.sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
    },

    // Merge bulk messages (initial load/pagination)
    mergeMessages: (state, action) => {
      const { chatId, messages } = action.payload;
      const existing = state.messages[chatId] || [];

      const merged = [...existing, ...messages].filter(
        (msg, index, self) => index === self.findIndex((m) => m.id === msg.id)
      );

      merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      state.messages[chatId] = merged;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserChats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserChats.fulfilled, (state, action) => {
        state.loading = false;
        state.chatRooms = action.payload;
      })
      .addCase(fetchUserChats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false;
        const { chatId, messages } = action.payload;
        const existing = state.messages[chatId] || [];

        const merged = [...existing, ...messages].filter(
          (msg, idx, self) => idx === self.findIndex((m) => m.id === msg.id)
        );

        merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        state.messages[chatId] = merged;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { receiveNewMessage, mergeMessages, updateMessageId } =
  chatSlice.actions;
export default chatSlice.reducer;
