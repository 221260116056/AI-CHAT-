import { apiRequest, API_BASE_URL, type ApiResponse } from "@/lib/api-client";
import type { AiProvider } from "@/types";

export async function codeAssist(data: {
  prompt: string;
  code?: string;
  language?: string;
  task?: "generate" | "explain" | "debug" | "refactor" | "review" | "test";
  provider?: AiProvider;
  model?: string;
}): Promise<ApiResponse<{ result: string; usage: { promptTokens: number; completionTokens: number } }>> {
  return apiRequest(`${API_BASE_URL}/v1/code/assist`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
