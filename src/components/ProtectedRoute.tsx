import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth, AuthUser } from '@/hooks/useAuth';
import { LoadingSkeleton } from '@/components/shared';

type AllowedRole = AuthUser['role'];

interface ProtectedRouteProps {
  allowedRoles?: AllowedRole[];
  redirectTo?: string;
}

export function ProtectedRoute({
  allowedRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md p-8">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-primary/20 animate-pulse" />
          </div>
          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="list" count={3} />
        </div>
      </div>
    );
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
