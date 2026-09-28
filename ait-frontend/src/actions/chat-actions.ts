import { apiRequest, API_BASE_URL, type ApiResponse } from "@/lib/api-client";
import type { ChatSession, ChatMessage, AiProvider } from "@/types";

export async function getChatSessions(): Promise<ApiResponse<ChatSession[]>> {
  return apiRequest<ChatSession[]>(`${API_BASE_URL}/v1/chat/sessions`);
}

export async function createChatSession(data: {
  title?: string;
  provider?: AiProvider;
  model?: string;
  systemPrompt?: string;
}): Promise<ApiResponse<ChatSession>> {
  return apiRequest<ChatSession>(`${API_BASE_URL}/v1/chat/sessions`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getChatSession(id: string): Promise<ApiResponse<{ session: ChatSession; messages: ChatMessage[] }>> {
  return apiRequest<{ session: ChatSession; messages: ChatMessage[] }>(`${API_BASE_URL}/v1/chat/sessions/${id}`);
}

export async function deleteChatSession(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`${API_BASE_URL}/v1/chat/sessions/${id}`, { method: "DELETE" });
}

export async function updateChatSessionTitle(id: string, title: string): Promise<ApiResponse<{ id: string; title: string }>> {
  return apiRequest<{ id: string; title: string }>(`${API_BASE_URL}/v1/chat/sessions/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ title }),
  });
}

export async function deleteChatMessage(sessionId: string, messageId: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`${API_BASE_URL}/v1/chat/sessions/${sessionId}/messages/${messageId}`, { method: "DELETE" });
}

export async function sendChatMessage(
  sessionId: string,
  data: { content: string; images?: string[]; provider?: AiProvider; model?: string }
): Promise<ApiResponse<{ content: string; usage: { promptTokens: number; completionTokens: number } }>> {
  return apiRequest(`${API_BASE_URL}/v1/chat/sessions/${sessionId}/messages`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getChatModels(): Promise<ApiResponse<Record<string, { models: string[]; defaultModel: string }>>> {
  return apiRequest(`${API_BASE_URL}/v1/chat/models`);
}

// Streaming chat — returns EventSource-like fetch
export async function streamChatMessage(
  sessionId: string,
  data: { content: string; images?: string[]; provider?: AiProvider; model?: string },
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
) {
  try {
    const response = await fetch(`${API_BASE_URL}/v1/chat/sessions/${sessionId}/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
      credentials: "include",
    });

    if (!response.ok || !response.body) {
      throw new Error("Stream failed");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const text = decoder.decode(value, { stream: true });
      const lines = text.split("\n");

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const payload = line.slice(6);
          if (payload === "[DONE]") {
            onDone();
          } else {
            try {
              const parsed = JSON.parse(payload) as { chunk?: string; error?: string };
              if (parsed.error) {
                onError(new Error(parsed.error));
                return;
              }
              if (parsed.chunk) {
                onChunk(parsed.chunk);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error("Unknown error"));
  }
}
