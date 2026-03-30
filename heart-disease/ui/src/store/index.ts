import { configureStore } from '@reduxjs/toolkit';
import predictionReducer from './slices/predictionSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    prediction: predictionReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
