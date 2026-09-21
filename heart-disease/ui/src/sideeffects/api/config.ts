export const API_BASE_URL = '/api';

/** Returns the stored access token or null. */
export function getAccessToken(): string | null {
  return localStorage.getItem('access_token');
}

/** Persist a token pair from the login/refresh response. */
export function saveTokens(access: string, refresh: string): void {
  localStorage.setItem('access_token', access);
  localStorage.setItem('refresh_token', refresh);
}

/** Clear tokens on logout. */
export function clearTokens(): void {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
}
