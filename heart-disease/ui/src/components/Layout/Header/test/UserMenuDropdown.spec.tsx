import { fireEvent, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import UserMenuDropdown from '../UserMenuDropdown';
import { renderWithProviders } from '../../../../test/renderWithProviders';

describe('UserMenuDropdown', () => {
  it('shows the pending avatar preview and updates crop position when the slider changes', () => {
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

    const preview = screen.getByRole('img', { name: 'Pending avatar preview' });
    expect(screen.getByText('Apply photo')).toBeInTheDocument();
    expect(screen.getByText('Horizontal')).toBeInTheDocument();
    expect(screen.getByText('Vertical')).toBeInTheDocument();
    expect(preview.style.backgroundPosition).toBe('50% 50%');

    fireEvent.change(screen.getByLabelText('Horizontal avatar alignment'), { target: { value: '75' } });

    expect(preview.style.backgroundPosition).toBe('75% 50%');

    fireEvent.change(screen.getByLabelText('Vertical avatar alignment'), { target: { value: '20' } });

    expect(preview.style.backgroundPosition).toBe('75% 20%');
  });
});

