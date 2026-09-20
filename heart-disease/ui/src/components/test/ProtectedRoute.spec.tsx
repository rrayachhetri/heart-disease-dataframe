import { screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import ProtectedRoute from '../ProtectedRoute';
import { setupStore } from '../../test/renderWithProviders';
import type { RootState } from '../../store';

describe('ProtectedRoute', () => {
  it('redirects expired sessions to the timeout page instead of the login route', () => {
    const preloadedState: Partial<RootState> = {
      auth: {
        user: { id: '1', email: 'dr@example.com', first_name: 'Dr', last_name: 'Smith', role: 'doctor', is_active: true, is_verified: true },
        avatarUrl: null,
        avatarPosition: '50% 50%',
        loading: false,
        error: null,
        initialized: true,
      },
      session: { status: 'expired', lastActivityAt: Date.now(), secondsLeft: 0 },
    };
    const store = setupStore(preloadedState);

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

