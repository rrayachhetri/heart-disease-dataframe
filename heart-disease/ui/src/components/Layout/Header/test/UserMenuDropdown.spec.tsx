import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UserMenuDropdown from '../UserMenuDropdown';
import { renderWithProviders } from '../../../../test/renderWithProviders';

describe('UserMenuDropdown', () => {
  it('shows a pending avatar alignment preview before the image is applied', () => {
    renderWithProviders(
      <UserMenuDropdown
        fileInputRef={{ current: null }}
        onClose={() => undefined}
        pendingAvatarUrl="data:image/png;base64,abc123"
        onApplyAvatar={() => undefined}
        onCancelAvatarUpload={() => undefined}
      />,
      {
        route: '/',
        preloadedState: {
          auth: {
            user: {
              id: '1',
              email: 'doctor@example.com',
              role: 'doctor',
              is_active: true,
              is_verified: true,
              first_name: 'Ada',
              last_name: 'Lovelace',
            },
            avatarUrl: null,
            avatarPosition: '50% 50%',
            loading: false,
            error: null,
            initialized: true,
          },
          notifications: {
            notifications: [],
            browserPermission: 'default',
          },
        },
      }
    );

    expect(screen.getByText('Apply photo')).toBeInTheDocument();
    expect(screen.getByText('Horizontal')).toBeInTheDocument();
    expect(screen.getByText('Vertical')).toBeInTheDocument();
  });
});

