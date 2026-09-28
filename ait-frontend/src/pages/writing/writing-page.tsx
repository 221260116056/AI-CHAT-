import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { generateContent } from "@/actions/writing-actions";
import { PenTool, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { toast } from "sonner";

const TYPES = [
  { value: "blog", label: "📝 Blog Post" },
  { value: "email", label: "✉️ Email" },
  { value: "social", label: "📱 Social Media" },
  { value: "product", label: "🛍️ Product Description" },
  { value: "essay", label: "📄 Essay" },
  { value: "copy", label: "💡 Marketing Copy" },
  { value: "outline", label: "📋 Outline" },
] as const;

const TONES = ["professional", "casual", "persuasive", "informative", "funny", "formal"] as const;
const LENGTHS = ["short", "medium", "long"] as const;
const PROVIDERS = [
  { value: "openai", label: "OpenAI GPT-4o" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "google", label: "Google Gemini" },
] as const;

export function WritingPage() {
  const [type, setType] = useState<typeof TYPES[number]["value"]>("blog");
  const [tone, setTone] = useState<typeof TONES[number]>("professional");
  const [length, setLength] = useState<typeof LENGTHS[number]>("medium");
  const [provider, setProvider] = useState<"openai" | "anthropic" | "google">("google");
  const [prompt, setPrompt] = useState("");
  const [context, setContext] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const wordCount = result.trim().split(/\s+/).filter(Boolean).length;

  const generate = useMutation({
    mutationFn: () => generateContent({ prompt, type, tone, length, provider, context: context || undefined }),
    onSuccess: (data) => {
      if (data.success) setResult(data.data.content);
      else toast.error(data.message);
    },
    onError: () => toast.error("Content generation failed"),
  });

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <PenTool size={20} style={{ color: "oklch(0.75 0.20 60)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>AI Writing</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Generate any type of content with AI — blogs, emails, social posts, and more
        </p>
      </div>

      {/* Type selector */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-6">
        {TYPES.map(({ value, label }) => (
          <button
            key={value}
            id={`writing-type-${value}`}
            onClick={() => setType(value)}
            className="px-3 py-2 rounded-lg text-xs font-medium transition-all text-center"
            style={{
              background: type === value ? "oklch(0.75 0.20 60)" : "var(--secondary)",
              color: type === value ? "white" : "var(--foreground-muted)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <label htmlFor="writing-prompt" className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
              Topic / Request
            </label>
            <textarea
              id="writing-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Write about the future of AI in healthcare..."
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
              style={{
                background: "var(--input)",
                border: "1px solid var(--input-border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--input-focus)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
            />
          </div>

          <div className="glass-card p-5">
            <label htmlFor="writing-context" className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
              Additional Context <span className="font-normal" style={{ color: "var(--foreground-muted)" }}>(optional)</span>
            </label>
            <textarea
              id="writing-context"
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Target audience, key points, brand voice..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
              style={{
                background: "var(--input)",
                border: "1px solid var(--input-border)",
                color: "var(--foreground)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--input-focus)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
            />
          </div>

          <div className="glass-card p-5 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground-muted)" }}>Tone</label>
              <select id="writing-tone" value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}
                className="px-3 py-2 rounded-lg text-sm outline-none capitalize"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                {TONES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground-muted)" }}>Length</label>
              <select id="writing-length" value={length} onChange={(e) => setLength(e.target.value as typeof length)}
                className="px-3 py-2 rounded-lg text-sm outline-none capitalize"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                {LENGTHS.map((l) => <option key={l} value={l} className="capitalize">{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground-muted)" }}>Provider</label>
              <select id="writing-provider" value={provider} onChange={(e) => setProvider(e.target.value as typeof provider)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <button
              id="writing-generate-btn"
              onClick={() => generate.mutate()}
              disabled={!prompt.trim() || generate.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "oklch(0.75 0.20 60)", color: "white" }}
            >
              {generate.isPending ? <><Loader2 size={15} className="animate-spin" /> Generating...</> : <><Sparkles size={15} /> Generate</>}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="glass-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Generated Content</span>
              {result && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--secondary)", color: "var(--foreground-muted)" }}>{wordCount} words</span>}
            </div>
            {result && (
              <button id="copy-writing-result" onClick={handleCopy} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:opacity-80" style={{ color: "var(--foreground-muted)", background: "var(--secondary)" }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          {generate.isPending ? (
            <div className="flex flex-col items-center justify-center flex-1 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: "oklch(0.75 0.20 60)" }} />
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Creating your content...</p>
            </div>
          ) : result ? (
            <div className="flex-1 overflow-y-auto text-sm whitespace-pre-wrap leading-relaxed" style={{ color: "var(--foreground)" }}>
              {result}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 gap-2">
              <PenTool size={36} className="opacity-20" style={{ color: "var(--foreground-muted)" }} />
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Your generated content will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
