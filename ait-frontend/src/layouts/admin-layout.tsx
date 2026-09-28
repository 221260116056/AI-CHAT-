import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthWithCache } from "@/hooks/use-auth-with-cache";
import { signOut } from "@/lib/auth-client";
import { LayoutDashboard, Users, ArrowLeft, LogOut, Shield } from "lucide-react";
import { toast } from "sonner";

const adminNavItems = [
  { to: "/admin", icon: LayoutDashboard, label: "Overview", end: true },
  { to: "/admin/users", icon: Users, label: "Users" },
];

export function AdminLayout() {
  const { user } = useAuthWithCache();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/auth/login");
    toast.success("Signed out successfully");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Admin Sidebar */}
      <aside
        className="flex flex-col w-[260px] shrink-0 border-r"
        style={{ background: "var(--background-secondary)", borderColor: "var(--border)" }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-6 h-16 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--error)" }}>
            <Shield size={16} className="text-white" />
          </div>
          <span className="font-semibold text-lg" style={{ color: "var(--foreground)" }}>Admin Panel</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {adminNavItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all"
              style={({ isActive }) => ({
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "var(--primary-foreground)" : "var(--foreground-muted)",
              })}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t space-y-1" style={{ borderColor: "var(--border)" }}>
          <button
            id="back-to-app-btn"
            onClick={() => navigate("/")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "var(--foreground-muted)" }}
          >
            <ArrowLeft size={18} />
            <span>Back to App</span>
          </button>
          <button
            id="admin-sign-out-btn"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{ color: "var(--error)" }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Admin content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Admin header */}
        <header className="h-16 border-b px-6 flex items-center justify-between shrink-0" style={{ borderColor: "var(--border)", background: "var(--background-secondary)" }}>
          <div />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
