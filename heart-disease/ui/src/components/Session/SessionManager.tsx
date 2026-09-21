/**
 * SessionManager — invisible component that drives session timers.
 *
 * Mounts once inside ProtectedRoute. Handles:
 *  - 1-second interval → dispatches tick()
 *  - DOM activity events → dispatches recordActivity()
 *  - Redirects to /session-timeout when status === 'expired'
 */

import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import type { AppDispatch, RootState } from '../../store';
import { tick, recordActivity, resetSession } from '../../store/slices/sessionSlice';
import { logout } from '../../sideeffects/slices/authSlice';

const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'];

export default function SessionManager() {
  const dispatch = useDispatch<AppDispatch>();
  const navigate  = useNavigate();
  const status    = useSelector((s: RootState) => s.session.status);

  // Reset the clock the moment the user enters a protected route.
  // Without this, the lastActivityAt from store init (before login typed)
  // would make the very first tick() think the session already expired.
  useEffect(() => {
    dispatch(resetSession());
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redirect on expiry
  useEffect(() => {
    if (status === 'expired') {
      dispatch(logout());
      navigate('/session-timeout', { replace: true });
    }
  }, [status, dispatch, navigate]);

  // 1-second tick drives the countdown
  useEffect(() => {
    const id = window.setInterval(() => dispatch(tick()), 1000);
    return () => window.clearInterval(id);
  }, [dispatch]);

  // User activity events reset the clock
  useEffect(() => {
    const handler = () => dispatch(recordActivity());
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, handler, { passive: true }));
    return () => ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, handler));
  }, [dispatch]);

  return null;
}
