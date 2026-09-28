import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getChatSessions, createChatSession, getChatSession,
  deleteChatSession, deleteChatMessage, streamChatMessage,
  updateChatSessionTitle,
} from "@/actions/chat-actions";
import { cn, formatRelativeTime } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus, Trash2, Send, MessageSquare, Bot, User, Loader2,
  Copy, Check, Sparkles, AlertCircle, RotateCw, RefreshCw,
  Pencil, X, Image as ImageIcon, Download, Maximize2
} from "lucide-react";
import { toast } from "sonner";
import type { ChatMessage, ChatSession } from "@/types";

const PROVIDERS = [
  { value: "google", label: "Google Gemini", models: ["gemini-3.5-flash-lite", "gemini-3.8-flash"] },
  { value: "openai", label: "OpenAI", models: ["gpt-4o", "gpt-4o-mini", "gpt-3.5-turbo"] },
  { value: "anthropic", label: "Anthropic", models: ["claude-3-5-sonnet-20241022", "claude-3-haiku-20240307"] },
] as const;

function TypingIndicator() {
  return (
    <div className="flex gap-3 animate-fade-in">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ background: "var(--primary)" }}>
        <Bot size={16} style={{ color: "var(--primary-foreground)" }} />
      </div>
      <div className="glass-card px-4 py-3 flex items-center gap-2 rounded-2xl rounded-tl-sm shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
        <Sparkles size={14} className="animate-spin text-primary opacity-80" />
        <div className="typing-dots flex gap-1 items-center h-4">
          <span /><span /><span />
        </div>
        <span className="text-xs text-muted-foreground ml-1">AI is thinking...</span>
      </div>
    </div>
  );
}

function MessageBubble({
  message,
  onResend,
  onRegenerate,
  onDelete,
  onViewImage,
  isStreaming,
}: {
  message: ChatMessage;
  onResend?: (content: string, images?: string[]) => void;
  onRegenerate?: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
  onViewImage?: (url: string) => void;
  isStreaming?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const isError = message.content?.startsWith("⚠️ **Error");
  const attachedImages = ((message.metadata as any)?.images as string[]) || [];

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className={cn("flex gap-3 animate-fade-in group relative", isUser && "flex-row-reverse")}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm"
        style={{
          background: isUser ? "var(--secondary)" : isError ? "var(--error)" : "var(--primary)",
        }}
      >
        {isUser ? (
          <User size={16} style={{ color: "var(--foreground)" }} />
        ) : isError ? (
          <AlertCircle size={16} style={{ color: "#fff" }} />
        ) : (
          <Bot size={16} style={{ color: "var(--primary-foreground)" }} />
        )}
      </div>

      <div className="flex-1 max-w-[80%] space-y-1">
        <div
          className={cn(
            "glass-card px-4 py-3 text-sm rounded-2xl shadow-sm transition-all",
            isUser ? "ml-auto rounded-tr-sm" : "rounded-tl-sm",
            isError && "border-red-500/50 bg-red-950/20"
          )}
          style={{
            background: isUser ? "var(--secondary)" : isError ? "rgba(239, 68, 68, 0.1)" : "var(--card)",
            borderColor: isUser ? "var(--border)" : isError ? "var(--error)" : "var(--border)",
          }}
        >
          {/* Render Attached Photos */}
          {attachedImages.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2.5">
              {attachedImages.map((imgUrl, i) => (
                <div key={i} className="relative group/img rounded-xl overflow-hidden border border-white/10 shadow-sm bg-black/20">
                  <img
                    src={imgUrl}
                    alt={`Attached photo ${i + 1}`}
                    className="max-h-52 max-w-xs object-cover rounded-xl transition-transform group-hover/img:scale-105 cursor-pointer"
                    onClick={() => onViewImage ? onViewImage(imgUrl) : window.open(imgUrl, "_blank")}
                  />
                  <button
                    type="button"
                    onClick={() => onViewImage ? onViewImage(imgUrl) : window.open(imgUrl, "_blank")}
                    className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-xs gap-1 cursor-pointer"
                  >
                    <Maximize2 size={14} />
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {isUser ? (
            <p className="whitespace-pre-wrap leading-relaxed select-text" style={{ color: "var(--foreground)" }}>{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none leading-relaxed select-text" style={{ color: "var(--foreground)" }}>
              {message.content ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic text-xs">No response</p>
              )}
            </div>
          )}
        </div>

        {/* Message footer with timestamp and action buttons */}
        <div
          className={cn(
            "flex items-center gap-2 px-1 text-[11px] font-medium",
            isUser ? "justify-end" : "justify-start"
          )}
          style={{ color: "var(--foreground-muted)" }}
        >
          <span>{formatRelativeTime(message.createdAt)}</span>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {isUser && onResend && (
              <button
                onClick={() => onResend(message.content, attachedImages)}
                disabled={isStreaming}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/10 text-primary transition-all disabled:opacity-30 cursor-pointer"
                title="Resend this message"
              >
                <RotateCw size={11} />
                <span>Resend</span>
              </button>
            )}

            {!isUser && onRegenerate && (
              <button
                onClick={() => onRegenerate(message)}
                disabled={isStreaming}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white/10 text-primary transition-all disabled:opacity-30 cursor-pointer"
                title="Regenerate response"
              >
                <RefreshCw size={11} />
                <span>Regenerate</span>
              </button>
            )}

            {message.content && (
              <button
                onClick={handleCopy}
                className="p-1 rounded-md hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground cursor-pointer"
                title="Copy text"
              >
                {copied ? <Check size={11} className="text-green-400" /> : <Copy size={11} />}
              </button>
            )}

            {onDelete && (
              <button
                onClick={() => onDelete(message.id)}
                disabled={isStreaming}
                className="p-1 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all disabled:opacity-30 cursor-pointer"
                title="Delete message"
              >
                <Trash2 size={11} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ChatPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [input, setInput] = useState("");
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [previewModalImage, setPreviewModalImage] = useState<string | null>(null);
  const [provider, setProvider] = useState<"openai" | "anthropic" | "google">("google");
  const [model, setModel] = useState("gemini-3.5-flash-lite");
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // Editing session title state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [isHeaderEditing, setIsHeaderEditing] = useState(false);
  const [headerTitle, setHeaderTitle] = useState("");

  // Fetch sessions list
  const { data: sessionsData } = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: getChatSessions,
  });
  const sessions = sessionsData?.success ? (sessionsData.data as ChatSession[]) : [];

  // Fetch current session
  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ["chat-session", sessionId],
    queryFn: () => getChatSession(sessionId!),
    enabled: !!sessionId,
  });
  const messages = sessionData?.success ? (sessionData.data.messages as ChatMessage[]) : [];

  // Create session mutation
  const createSession = useMutation({
    mutationFn: () => createChatSession({ provider, model }),
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
        navigate(`/chat/${data.data.id}`);
      }
    },
  });

  // Delete session
  const deleteSession = useMutation({
    mutationFn: (id: string) => deleteChatSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (sessionId) navigate("/chat");
      toast.success("Session deleted");
    },
  });

  // Rename session mutation
  const renameMutation = useMutation({
    mutationFn: ({ id, title }: { id: string; title: string }) =>
      updateChatSessionTitle(id, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["chat-session", sessionId] });
      setEditingSessionId(null);
      setIsHeaderEditing(false);
      toast.success("Chat renamed");
    },
    onError: () => toast.error("Failed to rename chat"),
  });

  // Delete individual message mutation
  const deleteMsgMutation = useMutation({
    mutationFn: (messageId: string) => deleteChatMessage(sessionId!, messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chat-session", sessionId] });
      toast.success("Message removed");
    },
  });

  // Scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent, isStreaming]);

  // Handle Photo File Upload
  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        toast.error(`"${file.name}" is not a valid image file.`);
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`"${file.name}" is too large (max 10MB).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (base64) {
          setSelectedImages((prev) => [...prev, base64]);
          toast.success("Photo attached");
        }
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeAttachedImage(index: number) {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  }

  // Handle Clipboard Paste for Images
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items || []);
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const base64 = event.target?.result as string;
            if (base64) {
              setSelectedImages((prev) => [...prev, base64]);
              toast.info("Image pasted from clipboard");
            }
          };
          reader.readAsDataURL(file);
        }
      }
    }
  }

  async function executeStream(targetSessionId: string, text: string, images?: string[]) {
    if (isStreaming || (!text.trim() && (!images || images.length === 0))) return;

    setIsStreaming(true);
    setStreamingContent("");

    await streamChatMessage(
      targetSessionId,
      { content: text, images, provider, model },
      (chunk) => setStreamingContent((prev) => prev + chunk),
      () => {
        setIsStreaming(false);
        setStreamingContent("");
        queryClient.invalidateQueries({ queryKey: ["chat-session", targetSessionId] });
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      },
      (error) => {
        setIsStreaming(false);
        setStreamingContent("");
        queryClient.invalidateQueries({ queryKey: ["chat-session", targetSessionId] });
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
        toast.error(error.message || "Failed to get AI response", { duration: 8000 });
      }
    );
  }

  async function handleSend() {
    const hasText = !!input.trim();
    const hasImages = selectedImages.length > 0;
    if ((!hasText && !hasImages) || isStreaming) return;

    let activeSessionId = sessionId;

    // Create session if none active
    if (!activeSessionId) {
      const result = await createChatSession({ provider, model });
      if (result.success) {
        activeSessionId = result.data.id;
        queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
        navigate(`/chat/${activeSessionId}`, { replace: true });
      } else {
        toast.error("Failed to create session: " + (result.message || "Unknown error"));
        return;
      }
    }

    const textToSend = input.trim() || (hasImages ? "Please analyze this image." : "");
    const imagesToSend = selectedImages.length > 0 ? [...selectedImages] : undefined;
    setInput("");
    setSelectedImages([]);
    await executeStream(activeSessionId, textToSend, imagesToSend);
  }

  // Resend user prompt
  async function handleResend(promptText: string, images?: string[]) {
    if (isStreaming || !promptText.trim()) return;
    if (!sessionId) {
      setInput(promptText);
      if (images) setSelectedImages(images);
      inputRef.current?.focus();
      return;
    }
    await executeStream(sessionId, promptText, images);
  }

  // Regenerate assistant response
  async function handleRegenerate(botMsg: ChatMessage) {
    if (isStreaming || !sessionId) return;
    const msgIdx = messages.findIndex((m) => m.id === botMsg.id);
    const prevUserMsg = messages.slice(0, msgIdx).reverse().find((m) => m.role === "user");
    if (prevUserMsg) {
      const prevImages = (prevUserMsg.metadata as any)?.images as string[] | undefined;
      await executeStream(sessionId, prevUserMsg.content, prevImages);
    } else {
      toast.error("No previous prompt found to regenerate");
    }
  }

  function startEditingSidebar(s: ChatSession, e: React.MouseEvent) {
    e.stopPropagation();
    setEditingSessionId(s.id);
    setEditTitle(s.title);
  }

  function saveSidebarEdit(id: string, e?: React.FormEvent) {
    e?.preventDefault();
    if (!editTitle.trim()) return;
    renameMutation.mutate({ id, title: editTitle });
  }

  function startEditingHeader() {
    if (!sessionData?.success) return;
    setHeaderTitle(sessionData.data.session.title);
    setIsHeaderEditing(true);
  }

  function saveHeaderEdit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!sessionId || !headerTitle.trim()) return;
    renameMutation.mutate({ id: sessionId, title: headerTitle });
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const providerConfig = PROVIDERS.find((p) => p.value === provider)!;

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--background)" }}>
      {/* Sessions sidebar */}
      <div className="w-64 border-r flex flex-col shrink-0" style={{ background: "var(--background-secondary)", borderColor: "var(--border)" }}>
        <div className="p-4 border-b shrink-0" style={{ borderColor: "var(--border)" }}>
          <button
            id="new-chat-btn"
            onClick={() => createSession.mutate()}
            disabled={createSession.isPending || isStreaming}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm hover:brightness-110 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
          >
            <Plus size={16} />
            New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length === 0 && (
            <div className="text-center py-8">
              <MessageSquare size={24} className="mx-auto mb-2 opacity-40" style={{ color: "var(--foreground-muted)" }} />
              <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>No conversations yet</p>
            </div>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-pointer group transition-all",
                s.id === sessionId ? "bg-opacity-100 font-medium" : "hover:opacity-80"
              )}
              style={{
                background: s.id === sessionId ? "var(--secondary)" : "transparent",
                color: s.id === sessionId ? "var(--foreground)" : "var(--foreground-muted)",
              }}
              onClick={() => {
                if (editingSessionId !== s.id) navigate(`/chat/${s.id}`);
              }}
            >
              <MessageSquare size={14} className="shrink-0 opacity-70" />

              {editingSessionId === s.id ? (
                <form
                  onSubmit={(e) => saveSidebarEdit(s.id, e)}
                  className="flex-1 flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    autoFocus
                    className="w-full text-xs px-2 py-1 rounded bg-black/40 border border-primary outline-none text-foreground"
                  />
                  <button
                    type="submit"
                    className="p-1 text-green-400 hover:text-green-300 transition-colors"
                    title="Save"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingSessionId(null)}
                    className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </form>
              ) : (
                <>
                  <span className="flex-1 text-xs truncate">{s.title}</span>
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-all">
                    <button
                      className="p-1 rounded-md hover:bg-white/10 transition-all text-muted-foreground hover:text-foreground"
                      onClick={(e) => startEditingSidebar(s, e)}
                      title="Rename chat"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      className="p-1 rounded-md hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession.mutate(s.id);
                      }}
                      title="Delete chat"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="h-14 border-b px-5 flex items-center justify-between shrink-0" style={{ borderColor: "var(--border)", background: "var(--background-secondary)" }}>
          <div className="flex items-center gap-3 flex-1 mr-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: "var(--primary)" }}>
              <Bot size={18} style={{ color: "var(--primary-foreground)" }} />
            </div>

            {isHeaderEditing ? (
              <form onSubmit={saveHeaderEdit} className="flex items-center gap-2 max-w-md flex-1">
                <input
                  type="text"
                  value={headerTitle}
                  onChange={(e) => setHeaderTitle(e.target.value)}
                  autoFocus
                  className="px-2.5 py-1 text-sm rounded-lg bg-black/40 border border-primary outline-none text-foreground w-full font-medium"
                />
                <button type="submit" className="p-1 text-green-400 hover:text-green-300" title="Save">
                  <Check size={16} />
                </button>
                <button type="button" onClick={() => setIsHeaderEditing(false)} className="p-1 text-muted-foreground hover:text-foreground" title="Cancel">
                  <X size={16} />
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={startEditingHeader} title="Click to rename chat">
                <span className="font-semibold text-sm truncate max-w-sm" style={{ color: "var(--foreground)" }}>
                  {sessionData?.success ? sessionData.data.session.title : "AI Chat"}
                </span>
                {sessionId && (
                  <Pencil size={13} className="opacity-0 group-hover:opacity-70 text-muted-foreground hover:text-primary transition-opacity" />
                )}
              </div>
            )}
          </div>

          {/* Provider selector */}
          <div className="flex items-center gap-2">
            <select
              id="provider-select"
              value={provider}
              onChange={(e) => {
                const p = e.target.value as "openai" | "anthropic" | "google";
                setProvider(p);
                setModel(PROVIDERS.find((pr) => pr.value === p)!.models[0]);
              }}
              className="text-xs px-3 py-1.5 rounded-lg outline-none font-medium cursor-pointer"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            >
              {PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
            <select
              id="model-select"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="text-xs px-3 py-1.5 rounded-lg outline-none font-medium cursor-pointer"
              style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}
            >
              {providerConfig.models.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {sessionLoading && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin" style={{ color: "var(--foreground-muted)" }} />
            </div>
          )}

          {!sessionId && !sessionLoading && (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg animate-bounce" style={{ background: "var(--primary)" }}>
                <Bot size={32} style={{ color: "var(--primary-foreground)" }} />
              </div>
              <div>
                <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>Start a conversation</h2>
                <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
                  Type a message below or click "New Chat" to begin
                </p>
              </div>
            </div>
          )}

          {messages.map((m) => (
            <MessageBubble
              key={m.id}
              message={m}
              onResend={handleResend}
              onRegenerate={handleRegenerate}
              onDelete={(id) => deleteMsgMutation.mutate(id)}
              onViewImage={(url) => setPreviewModalImage(url)}
              isStreaming={isStreaming}
            />
          ))}

          {isStreaming && (
            <>
              {streamingContent ? (
                <div className="flex gap-3 animate-fade-in">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ background: "var(--primary)" }}>
                    <Bot size={16} style={{ color: "var(--primary-foreground)" }} />
                  </div>
                  <div className="glass-card px-4 py-3 text-sm flex-1 max-w-[80%] rounded-2xl rounded-tl-sm shadow-sm" style={{ background: "var(--card)", borderColor: "var(--border)" }}>
                    <div className="prose prose-sm max-w-none leading-relaxed" style={{ color: "var(--foreground)" }}>
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <TypingIndicator />
              )}
            </>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t shrink-0" style={{ borderColor: "var(--border)", background: "var(--background-secondary)" }}>
          {/* Attached photos preview strip */}
          {selectedImages.length > 0 && (
            <div className="flex items-center gap-2 mb-2 p-2 rounded-xl bg-black/20 border border-white/10 overflow-x-auto">
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium px-1">
                <ImageIcon size={14} />
                <span>{selectedImages.length} Photo{selectedImages.length > 1 ? "s" : ""} attached:</span>
              </div>
              {selectedImages.map((img, idx) => (
                <div key={idx} className="relative group/thumb shrink-0 rounded-lg overflow-hidden border border-primary/30">
                  <img
                    src={img}
                    alt={`Selected ${idx + 1}`}
                    className="w-14 h-14 object-cover cursor-pointer hover:opacity-90"
                    onClick={() => setPreviewModalImage(img)}
                  />
                  <button
                    type="button"
                    onClick={() => removeAttachedImage(idx)}
                    className="absolute top-0.5 right-0.5 bg-black/80 hover:bg-red-600 text-white rounded-full p-0.5 shadow transition-colors cursor-pointer"
                    title="Remove photo"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => setSelectedImages([])}
                className="text-[11px] text-muted-foreground hover:text-red-400 px-2 py-1 rounded hover:bg-white/5 transition-colors cursor-pointer shrink-0 ml-auto"
              >
                Clear all
              </button>
            </div>
          )}

          <div
            className="flex items-end gap-2 p-2 rounded-2xl transition-all shadow-sm"
            style={{
              background: "var(--input)",
              border: "1px solid var(--input-border)",
            }}
          >
            {/* Hidden Photo File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handlePhotoUpload}
              className="hidden"
              id="chat-photos-input"
            />

            {/* Photos Button */}
            <button
              type="button"
              id="chat-photos-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="p-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-white/10 transition-all shrink-0 cursor-pointer flex items-center justify-center relative group"
              title="Attach Photos / Images (Vision)"
            >
              <ImageIcon size={20} className="group-hover:scale-110 transition-transform text-primary/80 group-hover:text-primary" />
              {selectedImages.length > 0 && (
                <span className="absolute 1 top-0 right-0 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {selectedImages.length}
                </span>
              )}
            </button>

            <textarea
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              onPaste={handlePaste}
              placeholder={
                selectedImages.length > 0
                  ? "Ask anything about the attached photo(s)..."
                  : "Message AI or attach photos... (Press Enter to send)"
              }
              rows={1}
              className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none transition-all max-h-36"
              style={{
                color: "var(--foreground)",
                lineHeight: "1.5",
              }}
            />

            <button
              id="chat-send-btn"
              onClick={handleSend}
              disabled={(!input.trim() && selectedImages.length === 0) || isStreaming}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-medium text-xs shrink-0 transition-all shadow-md hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              style={{
                background: "var(--primary)",
                color: "var(--primary-foreground)",
              }}
            >
              {isStreaming ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Send size={15} />
                  <span>Send</span>
                </>
              )}
            </button>
          </div>
          <div className="flex justify-between items-center px-2 mt-1.5 text-[11px]" style={{ color: "var(--foreground-muted)" }}>
            <span className="flex items-center gap-1.5">
              <span>Model: {model}</span>
              {selectedImages.length > 0 && (
                <span className="text-primary font-medium">• 📷 Multimodal Vision Active</span>
              )}
            </span>
            <span>Paste images or press <strong>Enter</strong> to send</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Photo Modal */}
      {previewModalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setPreviewModalImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] flex flex-col items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              <a
                href={previewModalImage}
                download="photo.png"
                className="p-2 rounded-xl bg-black/70 hover:bg-black text-white border border-white/20 transition-all hover:scale-105 flex items-center gap-1.5 text-xs font-medium"
              >
                <Download size={14} />
                <span>Save</span>
              </a>
              <button
                type="button"
                onClick={() => setPreviewModalImage(null)}
                className="p-2 rounded-xl bg-black/70 hover:bg-red-600 text-white border border-white/20 transition-all hover:scale-105 cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
            <img
              src={previewModalImage}
              alt="Photo preview"
              className="max-h-[85vh] max-w-full rounded-2xl border border-white/20 shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
