export const API_BASE_URL =
  import.meta.env.VITE_SERVER_BASE_URL ?? "http://localhost:3000";

export type ApiResponse<T> = {
  success: true;
  data: T;
  message?: string;
} | {
  success: false;
  error: string;
  message: string;
};

export type PaginatedResponse<T> = {
  success: true;
  data: T;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include",
  });

  const data = await response.json();

  if (!response.ok) {
    return {
      success: false,
      error: data.error ?? "Unknown",
      message: data.message ?? "An error occurred.",
    };
  }

  return data as ApiResponse<T>;
}
