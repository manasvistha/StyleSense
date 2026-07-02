import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Spinner } from '@/components/ui/misc';

function FullScreenLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Spinner className="h-8 w-8 text-primary" />
    </div>
  );
}

/** Requires any authenticated user. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

/** Requires an admin user. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== 'ADMIN') return <Navigate to="/app" replace />;
  return <>{children}</>;
}

/** Redirects authenticated users away from auth pages. */
export function RedirectIfAuthed({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <FullScreenLoader />;
  if (user) return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/app'} replace />;
  return <>{children}</>;
}
