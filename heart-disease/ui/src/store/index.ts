import { configureStore } from '@reduxjs/toolkit';
import predictionReducer from './slices/predictionSlice';
import notificationReducer from './slices/notificationSlice';
import authReducer from './slices/authSlice';
import sessionReducer from './slices/sessionSlice';
import systemReducer from './slices/systemSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    prediction: predictionReducer,
    notifications: notificationReducer,
    session: sessionReducer,
    system: systemReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
