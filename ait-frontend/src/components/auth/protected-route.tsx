import { Navigate, Outlet } from "react-router-dom";
import { useAuthWithCache } from "@/hooks/use-auth-with-cache";

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuthWithCache();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
          <p style={{ color: "var(--foreground-muted)" }} className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
