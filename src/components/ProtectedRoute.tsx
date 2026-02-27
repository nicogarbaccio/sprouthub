import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Route guard that redirects unauthenticated users to /auth.
 * Preserves the intended destination as a ?redirect param so
 * users return to the correct page after signing in.
 *
 * While auth is loading, renders nothing to prevent UI flash.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    // Render an empty shell while auth state is being resolved
    return <div className="min-h-dvh bg-background" />;
  }

  if (!user) {
    const redirectParam = location.pathname !== "/" ? `?redirect=${encodeURIComponent(location.pathname)}` : "";
    return <Navigate to={`/auth${redirectParam}`} replace />;
  }

  return <>{children}</>;
}
