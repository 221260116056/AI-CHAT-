import { apiRequest, API_BASE_URL, type ApiResponse } from "@/lib/api-client";
import type { AiProvider } from "@/types";

export async function summarizeText(data: {
  text: string;
  provider?: AiProvider;
  model?: string;
  style?: "concise" | "detailed" | "bullets" | "eli5";
  language?: string;
}): Promise<ApiResponse<{ summary: string; usage: { promptTokens: number; completionTokens: number } }>> {
  return apiRequest(`${API_BASE_URL}/v1/summarizer/summarize`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function documentQA(data: {
  document: string;
  question: string;
  provider?: AiProvider;
  model?: string;
}): Promise<ApiResponse<{ answer: string; usage: { promptTokens: number; completionTokens: number } }>> {
  return apiRequest(`${API_BASE_URL}/v1/summarizer/qa`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}
