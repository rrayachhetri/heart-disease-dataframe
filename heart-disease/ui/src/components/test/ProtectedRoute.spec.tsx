import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ProtectedRoute from '../ProtectedRoute';
import authReducer from '../../store/slices/authSlice';
import sessionReducer from '../../store/slices/sessionSlice';
import notificationReducer from '../../store/slices/notificationSlice';
import predictionReducer from '../../store/slices/predictionSlice';
import systemReducer from '../../store/slices/systemSlice';

describe('ProtectedRoute', () => {
  const createStore = (preloadedState?: any) =>
    configureStore({
      reducer: {
        auth: authReducer,
        session: sessionReducer,
        notifications: notificationReducer,
        prediction: predictionReducer,
        system: systemReducer,
      },
      preloadedState,
    });

  it('redirects expired sessions to the timeout page instead of the login route', () => {
    const store = createStore({
      auth: { user: { id: 1, email: 'dr@example.com', first_name: 'Dr', last_name: 'Smith', role: 'doctor' }, avatarUrl: null, loading: false, error: null, initialized: true },
      session: { status: 'expired', lastActivityAt: Date.now(), secondsLeft: 0 },
      notifications: { notifications: [] },
      prediction: { prediction: null },
      system: { unavailable: false },
    });

    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><div>dashboard content</div></ProtectedRoute>} />
            <Route path="/session-timeout" element={<div>session ended</div>} />
            <Route path="/login" element={<div>login page</div>} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByText('session ended')).toBeInTheDocument();
  });
});

