import { Link } from "react-router-dom";
import { useAuthWithCache } from "@/hooks/use-auth-with-cache";
import { MessageSquare, Image, FileText, Code2, PenTool, ArrowRight, Sparkles, Zap } from "lucide-react";

const tools = [
  {
    to: "/chat",
    icon: MessageSquare,
    label: "AI Chat",
    description: "Converse with GPT-4o, Claude, and Gemini in one place",
    color: "oklch(0.65 0.25 265)",
  },
  {
    to: "/image",
    icon: Image,
    label: "Image Generation",
    description: "Create stunning images with DALL-E 3",
    color: "oklch(0.68 0.22 310)",
  },
  {
    to: "/summarizer",
    icon: FileText,
    label: "Summarizer",
    description: "Summarize documents and answer questions about them",
    color: "oklch(0.70 0.18 145)",
  },
  {
    to: "/code",
    icon: Code2,
    label: "Code Assistant",
    description: "Generate, explain, debug, and refactor code",
    color: "oklch(0.72 0.20 200)",
  },
  {
    to: "/writing",
    icon: PenTool,
    label: "AI Writing",
    description: "Generate blog posts, emails, social content, and more",
    color: "oklch(0.75 0.20 60)",
  },
];

export function DashboardPage() {
  const { user } = useAuthWithCache();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} style={{ color: "var(--primary)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--primary)" }}>AI Tools Platform</span>
        </div>
        <h1 className="text-4xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
          {greeting},{" "}
          <span className="gradient-text">{user?.name?.split(" ")[0]}</span> 👋
        </h1>
        <p className="text-lg" style={{ color: "var(--foreground-muted)" }}>
          What would you like to create today?
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4 mb-10">
        {[
          { label: "AI Models", value: "10+", icon: Zap },
          { label: "Tools Available", value: "5", icon: Sparkles },
          { label: "Providers", value: "3", icon: MessageSquare },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="glass-card p-5 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--secondary)" }}>
              <Icon size={20} style={{ color: "var(--primary)" }} />
            </div>
            <div>
              <div className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</div>
              <div className="text-xs" style={{ color: "var(--foreground-muted)" }}>{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tools grid */}
      <div>
        <h2 className="text-lg font-semibold mb-5" style={{ color: "var(--foreground)" }}>Available Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map(({ to, icon: Icon, label, description, color }) => (
            <Link
              key={to}
              to={to}
              id={`tool-card-${label.toLowerCase().replace(/\s+/g, "-")}`}
              className="glass-card p-6 flex items-start gap-4 transition-all duration-200 hover:scale-[1.02] group"
              style={{ "--tool-color": color } as React.CSSProperties}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all group-hover:scale-110"
                style={{ background: `${color}20` }}
              >
                <Icon size={22} style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>{label}</h3>
                  <ArrowRight size={14} className="opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1" style={{ color }} />
                </div>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
