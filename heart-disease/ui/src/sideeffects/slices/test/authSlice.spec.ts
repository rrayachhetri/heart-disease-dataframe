import { describe, expect, it } from 'vitest';
import authReducer, { setAvatarPosition } from '../authSlice';

describe('authSlice', () => {
  it('stores the avatar position for uploaded images', () => {
    const next = authReducer(
      {
        user: null,
        avatarUrl: null,
        avatarPosition: '50% 50%',
        loading: false,
        error: null,
        initialized: true,
      },
      setAvatarPosition('30% 70%')
    );

    expect(next.avatarPosition).toBe('30% 70%');
  });
});

