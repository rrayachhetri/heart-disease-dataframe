import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import SessionManager from './Session/SessionManager';

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps a route that requires authentication.
 * Redirects to /login if no user is in the auth store.
 * Waits for the auth initialization check before deciding.
 * Mounts SessionManager to track activity and enforce the 10-minute idle timeout.
 */
export default function ProtectedRoute({ children }: Props) {
  const { user, initialized } = useSelector((s: RootState) => s.auth);
  const sessionStatus = useSelector((s: RootState) => s.session.status);
  const location = useLocation();

  // Still loading the stored token — show nothing to avoid flash
  if (!initialized) return null;

  if (sessionStatus === 'expired') {
    return <Navigate to="/session-timeout" replace />;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <>
      <SessionManager />
      {children}
    </>
  );
}
