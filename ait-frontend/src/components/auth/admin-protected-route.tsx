import { Navigate, Outlet } from "react-router-dom";
import { useAuthWithCache } from "@/hooks/use-auth-with-cache";

export function AdminProtectedRoute() {
  const { user, isLoading } = useAuthWithCache();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-10 h-10 rounded-full border-2 animate-spin" style={{ borderColor: "var(--border)", borderTopColor: "var(--primary)" }} />
      </div>
    );
  }

  if (!user || user.role !== "super_admin") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
