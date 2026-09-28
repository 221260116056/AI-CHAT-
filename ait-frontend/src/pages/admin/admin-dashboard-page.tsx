import { Shield, Users, Activity, Cpu } from "lucide-react";

export function AdminDashboardPage() {
  const stats = [
    { label: "Total Users", value: "—", icon: Users, color: "var(--primary)" },
    { label: "Active Sessions", value: "—", icon: Activity, color: "oklch(0.70 0.18 145)" },
    { label: "AI Requests Today", value: "—", icon: Cpu, color: "oklch(0.75 0.20 60)" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Shield size={20} style={{ color: "var(--error)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Admin Overview</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Platform management and monitoring
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="glass-card p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${color}20` }}>
              <Icon size={22} style={{ color }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-6">
        <h2 className="text-lg font-semibold mb-4" style={{ color: "var(--foreground)" }}>Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Manage Users", desc: "View, edit, ban, or delete users", href: "/admin/users" },
          ].map(({ label, desc, href }) => (
            <a key={href} href={href} className="glass-card p-4 flex flex-col gap-1 hover:opacity-80 transition-all">
              <span className="font-medium text-sm" style={{ color: "var(--foreground)" }}>{label}</span>
              <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{desc}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
