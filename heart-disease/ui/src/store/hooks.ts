/**
 * store/hooks.ts — Typed Redux hooks.
 *
 * Use these throughout the app instead of the plain `useDispatch` /
 * `useSelector` so that TypeScript infers the correct store types
 * without repeating the generic annotation at every call-site.
 *
 * @example
 *   import { useAppDispatch, useAppSelector } from '../store/hooks';
 *   const dispatch = useAppDispatch();
 *   const user = useAppSelector((s) => s.auth.user);
 */

import { useDispatch, useSelector } from 'react-redux';
import type { TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '.';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
