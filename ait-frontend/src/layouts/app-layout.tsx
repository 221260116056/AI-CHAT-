import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuthWithCache } from "@/hooks/use-auth-with-cache";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import {
  MessageSquare, Image, FileText, Code2, PenTool,
  LayoutDashboard, LogOut, Settings, ChevronRight, Sparkles, User
} from "lucide-react";
import { toast } from "sonner";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/chat", icon: MessageSquare, label: "AI Chat" },
  { to: "/image", icon: Image, label: "Image Gen" },
  { to: "/summarizer", icon: FileText, label: "Summarizer" },
  { to: "/code", icon: Code2, label: "Code Assistant" },
  { to: "/writing", icon: PenTool, label: "AI Writing" },
];

export function AppLayout() {
  const { user } = useAuthWithCache();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate("/auth/login");
    toast.success("Signed out successfully");
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sidebar */}
      <aside
        className="flex flex-col w-[260px] shrink-0 border-r overflow-hidden"
        style={{ background: "var(--background-secondary)", borderColor: "var(--border)" }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 h-16 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--primary)" }}>
            <Sparkles size={16} style={{ color: "var(--primary-foreground)" }} />
          </div>
          <span className="font-semibold text-lg gradient-text">AIT</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "text-white"
                    : "hover:text-white"
                )
              }
              style={({ isActive }) => ({
                background: isActive ? "var(--primary)" : "transparent",
                color: isActive ? "var(--primary-foreground)" : "var(--foreground-muted)",
              })}
              onMouseEnter={(e) => {
                if (!(e.currentTarget as HTMLElement).classList.contains("active")) {
                  (e.currentTarget as HTMLElement).style.background = "var(--secondary)";
                }
              }}
              onMouseLeave={(e) => {
                const isActive = e.currentTarget.getAttribute("aria-current") === "page";
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                }
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="p-3 border-t shrink-0" style={{ borderColor: "var(--border)" }}>
          {user?.role === "super_admin" && (
            <NavLink
              to="/admin"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium mb-1 transition-all"
              style={{ color: "var(--foreground-muted)" }}
            >
              <Settings size={18} />
              <span>Admin Panel</span>
              <ChevronRight size={14} className="ml-auto" />
            </NavLink>
          )}
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ background: "var(--background-tertiary)" }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0" style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
              {user?.name?.[0]?.toUpperCase() ?? <User size={14} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{user?.name}</p>
              <p className="text-xs truncate" style={{ color: "var(--foreground-muted)" }}>{user?.email}</p>
            </div>
            <button
              id="sign-out-btn"
              onClick={handleSignOut}
              className="p-1.5 rounded-md transition-all hover:opacity-80"
              style={{ color: "var(--foreground-muted)" }}
              title="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        <div className="animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
