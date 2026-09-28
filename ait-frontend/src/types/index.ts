export interface User {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image?: string | null;
  role: "user" | "admin" | "moderator" | "super_admin";
  banned?: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AiProvider = "openai" | "anthropic" | "google";

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  provider: AiProvider;
  model: string;
  systemPrompt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant" | "system";
  content: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
}

export interface AiImage {
  id: string;
  userId: string;
  prompt: string;
  revisedPrompt?: string | null;
  imageUrl?: string | null;
  model: string;
  size: string;
  quality: string;
  status: "pending" | "completed" | "failed";
  createdAt: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
