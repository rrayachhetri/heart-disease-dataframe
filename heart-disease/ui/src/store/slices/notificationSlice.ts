import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppNotification } from '../../types';

interface NotificationState {
  notifications: AppNotification[];
  browserPermission: NotificationPermission;
}

const saved = localStorage.getItem('notifications');
const initialNotifications: AppNotification[] = saved ? JSON.parse(saved) : [];

const initialState: NotificationState = {
  notifications: initialNotifications,
  browserPermission:
    typeof Notification !== 'undefined' ? Notification.permission : 'default',
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification(
      state,
      action: PayloadAction<Omit<AppNotification, 'id' | 'timestamp' | 'read'>>
    ) {
      const notification: AppNotification = {
        ...action.payload,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        read: false,
      };
      state.notifications.unshift(notification);
      if (state.notifications.length > 100)
        state.notifications = state.notifications.slice(0, 100);
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    markAsRead(state, action: PayloadAction<string>) {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n) n.read = true;
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    markAllAsRead(state) {
      state.notifications.forEach((n) => (n.read = true));
      localStorage.setItem('notifications', JSON.stringify(state.notifications));
    },
    clearNotifications(state) {
      state.notifications = [];
      localStorage.removeItem('notifications');
    },
    setBrowserPermission(state, action: PayloadAction<NotificationPermission>) {
      state.browserPermission = action.payload;
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  clearNotifications,
  setBrowserPermission,
} = notificationSlice.actions;
export default notificationSlice.reducer;
