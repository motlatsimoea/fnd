import { createSlice, createAsyncThunk, createSelector } from "@reduxjs/toolkit";
import axiosInstance from "../../utils/axiosInstance";

/* =======================
   ASYNC THUNKS
======================= */

export const fetchUserChats = createAsyncThunk(
  "chats/fetchUserChats",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/inbox/");
      return res.data;
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

export const fetchMessages = createAsyncThunk(
  "chats/fetchMessages",
  async ({ chatId, chatKey }, thunkAPI) => {
    try {
      const res = await axiosInstance.get(`/inbox/${chatId}/messages/`);
      return { chatKey, messages: res.data };
    } catch (err) {
      return thunkAPI.rejectWithValue(err.response?.data || err.message);
    }
  }
);

/* =======================
   SLICE
======================= */

const chatSlice = createSlice({
  name: "chats",
  initialState: {
    chatRooms: [],
    messages: {}, // { chatKey: [message, ...] }
    loading: false,
    error: null,
  },
  reducers: {
    receiveNewMessage: (state, action) => {
      const { chatKey, message } = action.payload;
      if (!state.messages[chatKey]) {
        state.messages[chatKey] = [];
      }

      const msg =
        message.sending === undefined
          ? { ...message, sending: true }
          : message;

      if (!state.messages[chatKey].some((m) => m.id === msg.id)) {
        state.messages[chatKey].push(msg);
      }
    },

    updateMessageId: (state, action) => {
      const { chatKey, tempId, newMessage } = action.payload;
      if (!state.messages[chatKey]) {
        state.messages[chatKey] = [];
      }

      const index = state.messages[chatKey].findIndex(
        (m) => m.id === tempId
      );

      const confirmedMessage = { ...newMessage, sending: false };

      if (index !== -1) {
        state.messages[chatKey][index] = confirmedMessage;
      } else {
        state.messages[chatKey].push(confirmedMessage);
      }

      // Deduplicate + sort
      state.messages[chatKey] = state.messages[chatKey]
        .filter(
          (msg, idx, self) =>
            idx === self.findIndex((m) => m.id === msg.id)
        )
        .sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );
    },

    markChatAsRead: (state, action) => {
      const { chatKey } = action.payload;

      const chat = state.chatRooms.find(
        (c) => c.unique_key === chatKey
      );

      if (chat) {
        chat.unread_count = 0;
      }
    },

    incrementUnreadCount: (state, action) => {
      const { chatKey } = action.payload;

      const chat = state.chatRooms.find(
        (c) => c.unique_key === chatKey
      );

      if (chat) {
        chat.unread_count = (chat.unread_count || 0) + 1;
      }
    },

    mergeMessages: (state, action) => {
      const { chatKey, messages } = action.payload;
      const existing = state.messages[chatKey] || [];

      const merged = [...existing, ...messages]
        .filter(
          (msg, idx, self) =>
            idx === self.findIndex((m) => m.id === msg.id)
        )
        .sort(
          (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
        );

      state.messages[chatKey] = merged;
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
        const { chatKey, messages } = action.payload;

        const existing = state.messages[chatKey] || [];

        const merged = [...existing, ...messages]
          .filter(
            (msg, idx, self) =>
              idx === self.findIndex((m) => m.id === msg.id)
          )
          .sort(
            (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
          );

        state.messages[chatKey] = merged;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

/* =======================
   SELECTORS (MEMOIZED)
======================= */

const selectChatsState = (state) => state.chats;

export const selectChatRooms = createSelector(
  [selectChatsState],
  (chats) => chats.chatRooms
);

export const selectMessagesMap = createSelector(
  [selectChatsState],
  (chats) => chats.messages
);

// Factory selectors (important!)
export const makeSelectChatByKey = (uniqueKey) =>
  createSelector(
    [selectChatRooms],
    (chatRooms) =>
      chatRooms.find((c) => c.unique_key === uniqueKey) || null
  );

export const makeSelectMessagesByKey = (uniqueKey) =>
  createSelector(
    [selectMessagesMap],
    (messages) => messages[uniqueKey] || []
  );

export const selectUnreadCount = createSelector(
  [selectChatRooms],
  (chatRooms) =>
    chatRooms.reduce(
      (total, chat) => total + (chat.unread_count || 0),
      0
    )
);

/* =======================
   EXPORTS
======================= */

export const {
  receiveNewMessage,
  mergeMessages,
  updateMessageId,
  incrementUnreadCount,
  markChatAsRead
} = chatSlice.actions;

export default chatSlice.reducer;
