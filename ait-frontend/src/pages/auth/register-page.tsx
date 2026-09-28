import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signUp } from "@/lib/auth-client";
import { Eye, EyeOff, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setIsLoading(true);
    try {
      const result = await signUp.email({ name, email, password });
      if (result.error) {
        toast.error(result.error.message ?? "Registration failed");
      } else {
        toast.success("Account created! Welcome to AIT.");
        navigate("/");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  }

  const inputStyle = {
    background: "var(--input)",
    border: "1px solid var(--input-border)",
    color: "var(--foreground)",
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--background)" }}>
      <div className="fixed inset-0 pointer-events-none" style={{
        background: "radial-gradient(ellipse 80% 50% at 50% -20%, oklch(0.65 0.25 265 / 0.15), transparent)"
      }} />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-4" style={{ background: "var(--primary)" }}>
            <Sparkles size={28} style={{ color: "var(--primary-foreground)" }} />
          </div>
          <h1 className="text-3xl font-bold gradient-text">Create account</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--foreground-muted)" }}>
            Get started with AIT for free
          </p>
        </div>

        <div className="glass-card p-8 space-y-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { id: "reg-name", label: "Full Name", type: "text", value: name, onChange: setName, placeholder: "John Doe" },
              { id: "reg-email", label: "Email", type: "email", value: email, onChange: setEmail, placeholder: "you@example.com" },
            ].map(({ id, label, type, value, onChange, placeholder }) => (
              <div key={id} className="space-y-2">
                <label htmlFor={id} className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
                  {label}
                </label>
                <input
                  id={id}
                  type={type}
                  required
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-4 py-2.5 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--input-focus)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
                />
              </div>
            ))}

            <div className="space-y-2">
              <label htmlFor="reg-password" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
                Password
              </label>
              <div className="relative">
                <input
                  id="reg-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  className="w-full px-4 py-2.5 pr-11 rounded-lg text-sm outline-none transition-all"
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "var(--input-focus)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded" style={{ color: "var(--foreground-muted)" }}>
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="register-submit-btn"
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 mt-2"
              style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
            >
              {isLoading ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <><UserPlus size={16} /> Create Account</>
              )}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-sm" style={{ color: "var(--foreground-muted)" }}>
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium hover:opacity-80" style={{ color: "var(--primary)" }}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
