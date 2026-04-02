import { API_BASE_URL, saveTokens, authHeaders } from './config';
import type { AuthUser, TokenPair, RegisterPayload, LoginPayload } from '../types';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return handleResponse<AuthUser>(res);
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const tokens = await handleResponse<TokenPair>(res);
  saveTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export async function refreshTokens(): Promise<TokenPair> {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) throw new Error('No refresh token');
  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  const tokens = await handleResponse<TokenPair>(res);
  saveTokens(tokens.access_token, tokens.refresh_token);
  return tokens;
}

export async function getMe(): Promise<AuthUser> {
  const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: authHeaders() });
  return handleResponse<AuthUser>(res);
}
