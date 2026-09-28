import { Navigate, Outlet } from "react-router-dom";
import { useAuthWithCache } from "@/hooks/use-auth-with-cache";

export function GuestRoute() {
  const { isAuthenticated, isLoading } = useAuthWithCache();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
