import { api } from './api';
import { saveTokens } from './config';
import type { AuthUser, TokenPair, RegisterPayload, LoginPayload } from '../../types';

export async function register(payload: RegisterPayload): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/register', payload);
  return data;
}

export async function login(payload: LoginPayload): Promise<TokenPair> {
  const { data } = await api.post<TokenPair>('/auth/login', payload);
  saveTokens(data.access_token, data.refresh_token);
  return data;
}

export async function refreshTokens(): Promise<TokenPair> {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) throw new Error('No refresh token');
  const { data } = await api.post<TokenPair>('/auth/refresh', { refresh_token });
  saveTokens(data.access_token, data.refresh_token);
  return data;
}

export async function getMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}

export async function forgotPassword(
  email: string,
  first_name: string,
  last_name: string,
): Promise<{ message: string; dev_reset_token?: string }> {
  const { data } = await api.post('/auth/forgot-password', { email, first_name, last_name });
  return data;
}

export async function resetPassword(token: string, new_password: string): Promise<{ message: string }> {
  const { data } = await api.post('/auth/reset-password', { token, new_password });
  return data;
}
