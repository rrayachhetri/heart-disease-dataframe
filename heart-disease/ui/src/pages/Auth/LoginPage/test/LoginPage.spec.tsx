import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import LoginPage from '../../LoginPage';
import { renderWithProviders } from '../../../../test/renderWithProviders';

describe('LoginPage', () => {
  it('renders login form fields and submit button', () => {
    renderWithProviders(<LoginPage />, { route: '/login' });

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('you@example.com')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('shows forgot-password call to action when auth error is present', () => {
    renderWithProviders(<LoginPage />, {
      route: '/login',
      preloadedState: {
        auth: {
          user: null,
          avatarUrl: null,
          avatarPosition: '50% 50%',
          loading: false,
          error: 'Invalid credentials',
          initialized: true,
        },
      },
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reset it/i })).toBeInTheDocument();
  });
});
