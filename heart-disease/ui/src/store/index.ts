import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import predictionReducer from '../sideeffects/slices/predictionSlice';
import notificationReducer from './slices/notificationSlice';
import authReducer from '../sideeffects/slices/authSlice';
import sessionReducer from './slices/sessionSlice';
import systemReducer from './slices/systemSlice';
import { api } from '../sideeffects/api/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    prediction: predictionReducer,
    notifications: notificationReducer,
    session: sessionReducer,
    system: systemReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
