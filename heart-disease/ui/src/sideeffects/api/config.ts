export const API_BASE_URL = '/api';
export const JAVA_PREVIEW = import.meta.env.VITE_API_BACKEND === 'java';

const accessTokenKey = JAVA_PREVIEW ? 'java_access_token' : 'access_token';
const refreshTokenKey = JAVA_PREVIEW ? 'java_refresh_token' : 'refresh_token';

/** Returns the stored access token or null. */
export function getAccessToken(): string | null {
  return localStorage.getItem(accessTokenKey);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(refreshTokenKey);
}

export function getPythonAccessToken(): string | null {
  return JAVA_PREVIEW ? null : getAccessToken();
}

/** Persist a token pair from the login/refresh response. */
export function saveTokens(access: string, refresh: string): void {
  localStorage.setItem(accessTokenKey, access);
  localStorage.setItem(refreshTokenKey, refresh);
}

/** Clear tokens on logout. */
export function clearTokens(): void {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(refreshTokenKey);
}
