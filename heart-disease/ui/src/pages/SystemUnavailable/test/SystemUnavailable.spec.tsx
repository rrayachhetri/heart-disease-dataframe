import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import SystemUnavailablePage from '../index';

const dispatch = vi.fn();
vi.mock('../../../store/hooks', () => ({
  useAppDispatch: () => dispatch,
  useAppSelector: () => ({ reason: 'api_down', detectedAt: null }),
}));
vi.mock('../../../sideeffects/api/config', () => ({ JAVA_PREVIEW: true }));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

it('waits for both Java and Python before clearing an outage in preview mode', async () => {
  const fetchMock = vi.fn()
    .mockResolvedValueOnce({ ok: true })
    .mockResolvedValueOnce({ ok: false })
    .mockResolvedValueOnce({ ok: true })
    .mockResolvedValueOnce({ ok: true });
  vi.stubGlobal('fetch', fetchMock);
  render(<SystemUnavailablePage />);

  fireEvent.click(screen.getByRole('button', { name: /retry now/i }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  expect(dispatch).not.toHaveBeenCalled();

  await waitFor(() => expect(screen.getByRole('button', { name: /retry now/i })).toBeEnabled());
  fireEvent.click(screen.getByRole('button', { name: /retry now/i }));
  await waitFor(() => expect(dispatch).toHaveBeenCalledWith({ type: 'system/clearUnavailable' }));
  expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
    '/api/health', '/java-api/doctors', '/api/health', '/java-api/doctors',
  ]);
});
