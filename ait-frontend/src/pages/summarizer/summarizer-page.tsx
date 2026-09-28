import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { summarizeText, documentQA } from "@/actions/summarizer-actions";
import { FileText, Loader2, Copy, Check, MessageSquare, AlignLeft } from "lucide-react";
import { toast } from "sonner";

const STYLES = [
  { value: "concise", label: "Concise" },
  { value: "detailed", label: "Detailed" },
  { value: "bullets", label: "Bullet Points" },
  { value: "eli5", label: "ELI5" },
] as const;

const PROVIDERS = [
  { value: "openai", label: "OpenAI GPT-4o" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "google", label: "Google Gemini" },
] as const;

export function SummarizerPage() {
  const [activeTab, setActiveTab] = useState<"summarize" | "qa">("summarize");
  const [text, setText] = useState("");
  const [style, setStyle] = useState<"concise" | "detailed" | "bullets" | "eli5">("concise");
  const [provider, setProvider] = useState<"openai" | "anthropic" | "google">("google");
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const summarize = useMutation({
    mutationFn: () => summarizeText({ text, style, provider }),
    onSuccess: (data) => {
      if (data.success) setResult(data.data.summary);
      else toast.error(data.message);
    },
    onError: () => toast.error("Summarization failed"),
  });

  const qa = useMutation({
    mutationFn: () => documentQA({ document: text, question, provider }),
    onSuccess: (data) => {
      if (data.success) setResult(data.data.answer);
      else toast.error(data.message);
    },
    onError: () => toast.error("Q&A failed"),
  });

  const isLoading = summarize.isPending || qa.isPending;

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied to clipboard");
  }

  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={20} style={{ color: "oklch(0.70 0.18 145)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>AI Summarizer</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Summarize documents or ask questions about your text
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl mb-6 w-fit" style={{ background: "var(--secondary)" }}>
        {[
          { value: "summarize" as const, icon: AlignLeft, label: "Summarize" },
          { value: "qa" as const, icon: MessageSquare, label: "Q&A" },
        ].map(({ value, icon: Icon, label }) => (
          <button
            key={value}
            id={`tab-${value}`}
            onClick={() => { setActiveTab(value); setResult(""); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === value ? "var(--card)" : "transparent",
              color: activeTab === value ? "var(--foreground)" : "var(--foreground-muted)",
              boxShadow: activeTab === value ? "0 1px 3px rgba(0,0,0,0.3)" : "none",
            }}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input */}
        <div className="space-y-4">
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <label htmlFor="summarizer-text" className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
                {activeTab === "summarize" ? "Text to Summarize" : "Document"}
              </label>
              <span className="text-xs" style={{ color: "var(--foreground-muted)" }}>{wordCount} words</span>
            </div>
            <textarea
              id="summarizer-text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste your text here..."
              rows={10}
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

          {activeTab === "qa" && (
            <div className="glass-card p-5">
              <label htmlFor="summarizer-question" className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
                Your Question
              </label>
              <input
                id="summarizer-question"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="What is this document about?"
                className="w-full px-3 py-2 rounded-lg text-sm outline-none transition-all"
                style={{
                  background: "var(--input)",
                  border: "1px solid var(--input-border)",
                  color: "var(--foreground)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--input-focus)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
              />
            </div>
          )}

          {/* Controls */}
          <div className="glass-card p-5 flex flex-wrap gap-3 items-end">
            {activeTab === "summarize" && (
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground-muted)" }}>Style</label>
                <select
                  id="summarizer-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as typeof style)}
                  className="px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
                >
                  {STYLES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            )}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground-muted)" }}>Provider</label>
              <select
                id="summarizer-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as typeof provider)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <button
              id="summarizer-submit-btn"
              onClick={() => activeTab === "summarize" ? summarize.mutate() : qa.mutate()}
              disabled={!text.trim() || (activeTab === "qa" && !question.trim()) || isLoading}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "oklch(0.70 0.18 145)", color: "white" }}
            >
              {isLoading ? <><Loader2 size={15} className="animate-spin" /> Processing...</> : <><FileText size={15} /> {activeTab === "summarize" ? "Summarize" : "Answer"}</>}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Result</span>
            {result && (
              <button id="copy-result-btn" onClick={handleCopy} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md transition-all hover:opacity-80" style={{ color: "var(--foreground-muted)", background: "var(--secondary)" }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-48 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: "oklch(0.70 0.18 145)" }} />
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Processing your text...</p>
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm leading-relaxed" style={{ color: "var(--foreground)" }}>
              {result}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 gap-2">
              <FileText size={32} className="opacity-20" style={{ color: "var(--foreground-muted)" }} />
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Your result will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
