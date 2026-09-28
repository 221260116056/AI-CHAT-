import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { codeAssist } from "@/actions/code-actions";
import { Code2, Loader2, Copy, Check, Wand2 } from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const TASKS = [
  { value: "generate", label: "Generate" },
  { value: "explain", label: "Explain" },
  { value: "debug", label: "Debug" },
  { value: "refactor", label: "Refactor" },
  { value: "review", label: "Review" },
  { value: "test", label: "Write Tests" },
] as const;

const LANGUAGES = ["", "JavaScript", "TypeScript", "Python", "Rust", "Go", "Java", "C++", "SQL", "Bash", "HTML/CSS"];
const PROVIDERS = [
  { value: "openai", label: "OpenAI GPT-4o" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "google", label: "Google Gemini" },
] as const;

export function CodePage() {
  const [task, setTask] = useState<typeof TASKS[number]["value"]>("generate");
  const [prompt, setPrompt] = useState("");
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("");
  const [provider, setProvider] = useState<"openai" | "anthropic" | "google">("google");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  const assist = useMutation({
    mutationFn: () => codeAssist({ prompt, code: code || undefined, language, task, provider }),
    onSuccess: (data) => {
      if (data.success) setResult(data.data.result);
      else toast.error(data.message);
    },
    onError: () => toast.error("Code assistance failed"),
  });

  function handleCopy() {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Copied!");
  }

  const needsCode = ["explain", "debug", "refactor", "review", "test"].includes(task);

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Code2 size={20} style={{ color: "oklch(0.72 0.20 200)" }} />
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>Code Assistant</h1>
        </div>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
          Generate, explain, debug, refactor, and test code with AI
        </p>
      </div>

      {/* Task selector */}
      <div className="flex gap-2 flex-wrap mb-6">
        {TASKS.map(({ value, label }) => (
          <button
            key={value}
            id={`task-${value}`}
            onClick={() => setTask(value)}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: task === value ? "oklch(0.72 0.20 200)" : "var(--secondary)",
              color: task === value ? "white" : "var(--foreground-muted)",
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
            <label htmlFor="code-prompt" className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
              {task === "generate" ? "Describe what to build" : "Instructions / Context"}
            </label>
            <textarea
              id="code-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={task === "generate"
                ? "Build a React hook that fetches paginated data..."
                : "What should be done with this code..."
              }
              rows={4}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none transition-all"
              style={{
                background: "var(--input)",
                border: "1px solid var(--input-border)",
                color: "var(--foreground)",
                fontFamily: "var(--font-mono)",
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--input-focus)")}
              onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
            />
          </div>

          {(needsCode || code) && (
            <div className="glass-card p-5">
              <label htmlFor="code-input" className="block text-sm font-medium mb-2" style={{ color: "var(--foreground)" }}>
                Code {needsCode ? "(required)" : "(optional)"}
              </label>
              <textarea
                id="code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                rows={8}
                className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none transition-all"
                style={{
                  background: "var(--input)",
                  border: "1px solid var(--input-border)",
                  color: "var(--foreground)",
                  fontFamily: "var(--font-mono)",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--input-focus)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--input-border)")}
              />
            </div>
          )}

          <div className="glass-card p-5 flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground-muted)" }}>Language</label>
              <select
                id="code-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                <option value="">Auto-detect</option>
                {LANGUAGES.slice(1).map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--foreground-muted)" }}>Provider</label>
              <select
                id="code-provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as typeof provider)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
              >
                {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
            <button
              id="code-assist-btn"
              onClick={() => assist.mutate()}
              disabled={!prompt.trim() || (needsCode && !code.trim()) || assist.isPending}
              className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "oklch(0.72 0.20 200)", color: "white" }}
            >
              {assist.isPending ? <><Loader2 size={15} className="animate-spin" /> Processing...</> : <><Wand2 size={15} /> Run</>}
            </button>
          </div>
        </div>

        {/* Output */}
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium" style={{ color: "var(--foreground)" }}>Output</span>
            {result && (
              <button id="copy-code-result" onClick={handleCopy} className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:opacity-80" style={{ color: "var(--foreground-muted)", background: "var(--secondary)" }}>
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
            )}
          </div>
          {assist.isPending ? (
            <div className="flex flex-col items-center justify-center h-64 gap-3">
              <Loader2 size={28} className="animate-spin" style={{ color: "oklch(0.72 0.20 200)" }} />
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>AI is working on your code...</p>
            </div>
          ) : result ? (
            <div className="prose prose-sm max-w-none overflow-auto" style={{ color: "var(--foreground)" }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 gap-2">
              <Code2 size={36} className="opacity-20" style={{ color: "var(--foreground-muted)" }} />
              <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Your code output will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
