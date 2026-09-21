/**
 * Shared axios instance — the single HTTP client for all API calls.
 *
 * Centralizes: auth header injection, and outage detection (dispatches
 * setUnavailable on network errors / 5xx, mirroring the previous
 * fetch-based apiFetch wrapper) so every api/*.ts module gets this for free.
 */
import axios, { type AxiosError } from 'axios';
import { API_BASE_URL, getAccessToken } from './config';
import { store } from '../../store';
import { setUnavailable } from '../../store/slices/systemSlice';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string }>) => {
    if (!error.response) {
      store.dispatch(setUnavailable('network'));
      return Promise.reject(new Error('Network request failed'));
    }
    if (error.response.status >= 500) {
      store.dispatch(setUnavailable(error.response.status === 503 ? 'model_not_loaded' : 'api_down'));
    }
    const detail = error.response.data?.detail;
    return Promise.reject(new Error(detail || `Request failed: ${error.response.status}`));
  }
);
