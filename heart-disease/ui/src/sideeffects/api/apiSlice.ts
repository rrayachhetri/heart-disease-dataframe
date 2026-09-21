/**
 * RTK Query base API slice — the single caching layer for server-driven data.
 *
 * Uses `fakeBaseQuery` so each endpoint's `queryFn` wraps the existing,
 * already-tested fetch functions in this folder (predictApi/doctorApi),
 * instead of re-implementing request logic. This gives every read (query)
 * endpoint automatic caching, request dedup, and tag-based invalidation
 * on writes (mutations), without changing any existing fetch behavior.
 */
import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

export interface ApiQueryError {
  message: string;
}

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery<ApiQueryError>(),
  tagTypes: [
    'ModelInfo',
    'DatasetComparison',
    'DoctorRecommendations',
    'LocalDoctors',
    'AvailableSlots',
    'AppointmentRequests',
    'DoctorProfile',
    'MySlots',
  ],
  endpoints: () => ({}),
});

/** Normalizes a thrown Error into the shape fakeBaseQuery expects. */
export function toQueryError(err: unknown): { error: ApiQueryError } {
  return { error: { message: err instanceof Error ? err.message : 'Request failed' } };
}

/** Extracts a displayable message from an RTK Query error result. */
export function getErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === 'object' && 'message' in error && typeof (error as ApiQueryError).message === 'string') {
    return (error as ApiQueryError).message;
  }
  return fallback;
}
