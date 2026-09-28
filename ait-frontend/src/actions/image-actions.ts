import { apiRequest, API_BASE_URL } from "@/lib/api-client";
import type { AiImage } from "@/types";
import type { ApiResponse } from "@/lib/api-client";

export async function getImages(): Promise<ApiResponse<AiImage[]>> {
  return apiRequest<AiImage[]>(`${API_BASE_URL}/v1/image`);
}

export async function generateImage(data: {
  prompt: string;
  model?: string;
  size?: string;
  quality?: "standard" | "hd";
  style?: string;
  negativePrompt?: string;
  seed?: number;
  localEndpoint?: string;
  initImage?: string;
  denoisingStrength?: number;
}): Promise<ApiResponse<AiImage>> {
  return apiRequest<AiImage>(`${API_BASE_URL}/v1/image/generate`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function describeImage(image: string): Promise<ApiResponse<{ prompt: string }>> {
  return apiRequest<{ prompt: string }>(`${API_BASE_URL}/v1/image/describe`, {
    method: "POST",
    body: JSON.stringify({ image }),
  });
}

export async function deleteImage(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`${API_BASE_URL}/v1/image/${id}`, { method: "DELETE" });
}
