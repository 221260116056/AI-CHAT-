import { apiRequest, API_BASE_URL, type ApiResponse } from "@/lib/api-client";
import type { AiProvider } from "@/types";

export async function generateContent(data: {
  prompt: string;
  type?: "blog" | "email" | "social" | "product" | "essay" | "copy" | "outline";
  tone?: "professional" | "casual" | "persuasive" | "informative" | "funny" | "formal";
  length?: "short" | "medium" | "long";
  provider?: AiProvider;
  model?: string;
  context?: string;
}): Promise<ApiResponse<{ content: string; usage: { promptTokens: number; completionTokens: number } }>> {
  return apiRequest(`${API_BASE_URL}/v1/writing/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
