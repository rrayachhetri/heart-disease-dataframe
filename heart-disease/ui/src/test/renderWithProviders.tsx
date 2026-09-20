import { configureStore } from '@reduxjs/toolkit';
import { render, type RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';

import authReducer from '../store/slices/authSlice';
import notificationReducer from '../store/slices/notificationSlice';
import sessionReducer from '../store/slices/sessionSlice';
import systemReducer from '../store/slices/systemSlice';
import type { RootState } from '../store';

const predictionStubReducer = (
  state = {
    currentResult: null,
    currentPatientData: null,
    history: [],
    loading: false,
    error: null,
  }
) => state;

const reducer = {
  auth: authReducer,
  prediction: predictionStubReducer,
  notifications: notificationReducer,
  session: sessionReducer,
  system: systemReducer,
};

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer,
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
