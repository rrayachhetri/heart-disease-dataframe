import { configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

import authReducer from '../sideeffects/slices/authSlice';
import predictionReducer from '../sideeffects/slices/predictionSlice';
import notificationReducer from '../store/slices/notificationSlice';
import sessionReducer from '../store/slices/sessionSlice';
import systemReducer from '../store/slices/systemSlice';
import { api } from '../sideeffects/api/apiSlice';
import type { RootState } from '../store';

const reducer = {
  auth: authReducer,
  prediction: predictionReducer,
  notifications: notificationReducer,
  session: sessionReducer,
  system: systemReducer,
  [api.reducerPath]: api.reducer,
};

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer,
    middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(api.middleware),
    preloadedState: preloadedState as RootState,
  });
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { preloadedState, route = '/', ...renderOptions }: ExtendedRenderOptions = {}
) {
  const store = setupStore(preloadedState);

  return {
    store,
    ...render(
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
      </Provider>,
      renderOptions
    ),
  };
}
