import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

interface Props {
  children: React.ReactNode;
}

/**
 * Wraps a route that requires authentication.
 * Redirects to /login if no user is in the auth store.
 * Waits for the auth initialization check before deciding.
 */
export default function ProtectedRoute({ children }: Props) {
  const { user, initialized } = useSelector((s: RootState) => s.auth);
  const location = useLocation();

  // Still loading the stored token — show nothing to avoid flash
  if (!initialized) return null;

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
