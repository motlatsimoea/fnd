// src/features/notifications/notice-slice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from '../../utils/axiosInstance';

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (unreadOnly = false) => {
    const response = await axiosInstance.get(`/api/notifications/?unread=${unreadOnly}`);
    return response.data; // contains count, next, previous, results[], unread_count
  }
);

export const fetchInboxNotifications = createAsyncThunk(
  'notifications/fetchInbox',
  async (unreadOnly = false) => {
    const response = await axiosInstance.get(`/api/notifications/inbox/?unread=${unreadOnly}`);
    return response.data;
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId) => {
    await axiosInstance.post(`/api/notifications/mark-as-read/${notificationId}/`);
    return notificationId;
  }
);

export const markAllGeneralAsRead = createAsyncThunk(
  'notifications/markAllGeneralAsRead',
  async () => {
    await axiosInstance.post(`/api/notifications/mark-all-read/`);
    return 'general';
  }
);

export const markAllInboxAsRead = createAsyncThunk(
  'notifications/markAllInboxAsRead',
  async () => {
    await axiosInstance.post(`/api/notifications/inbox/mark-all-read/`);
    return 'inbox';
  }
);

const initialState = {
  general: {
    items: [],
    unreadCount: 0,
    totalCount: 0,
    latestTimestamp: null,
    loading: false,
    error: null
  },
  inbox: {
    items: [],
    unreadCount: 0,
    totalCount: 0,
    latestTimestamp: null,
    loading: false,
    error: null
  }
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    prependNotification: (state, action) => {
      const target = action.payload.notification_type === 'message' ? 'inbox' : 'general';
      state[target].items.unshift(action.payload);
      state[target].unreadCount += 1;
      state[target].totalCount += 1;
      state[target].latestTimestamp = action.payload.timestamp;
    }
  },
  extraReducers: (builder) => {
    builder
      // general notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.general.loading = true;
        state.general.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { results, unread_count, count } = action.payload;
        state.general.items = results;
        state.general.unreadCount = unread_count;
        state.general.totalCount = count;
        state.general.latestTimestamp = results.length > 0 ? results[0].timestamp : null;
        state.general.loading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.general.loading = false;
        state.general.error = action.error.message;
      })

      // inbox notifications
      .addCase(fetchInboxNotifications.pending, (state) => {
        state.inbox.loading = true;
        state.inbox.error = null;
      })
      .addCase(fetchInboxNotifications.fulfilled, (state, action) => {
        const { results, unread_count, count } = action.payload;
        state.inbox.items = results;
        state.inbox.unreadCount = unread_count;
        state.inbox.totalCount = count;
        state.inbox.latestTimestamp = results.length > 0 ? results[0].timestamp : null;
        state.inbox.loading = false;
      })
      .addCase(fetchInboxNotifications.rejected, (state, action) => {
        state.inbox.loading = false;
        state.inbox.error = action.error.message;
      })

      // mark single notification as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        ['general', 'inbox'].forEach(type => {
          const index = state[type].items.findIndex(n => n.id === id);
          if (index !== -1 && !state[type].items[index].is_read) {
            state[type].items[index].is_read = true;
            state[type].unreadCount = Math.max(state[type].unreadCount - 1, 0);
          }
        });
      })

      // mark all as read
      .addCase(markAllGeneralAsRead.fulfilled, (state) => {
        state.general.items.forEach(n => { n.is_read = true; });
        state.general.unreadCount = 0;
      })
      .addCase(markAllInboxAsRead.fulfilled, (state) => {
        state.inbox.items.forEach(n => { n.is_read = true; });
        state.inbox.unreadCount = 0;
      });
  }
});

export const { prependNotification } = notificationsSlice.actions;
export default notificationsSlice.reducer;
