import { apiRequest, API_BASE_URL, type ApiResponse, type PaginatedResponse } from "@/lib/api-client";
import type { User } from "@/types";

export async function adminListUsers(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<PaginatedResponse<User[]>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  if (params.search) query.set("search", params.search);

  const response = await fetch(`${API_BASE_URL}/v1/admin/users?${query}`, {
    credentials: "include",
  });
  return response.json();
}

export async function adminUpdateUser(id: string, data: {
  name?: string;
  role?: string;
  banned?: boolean;
  banReason?: string;
}): Promise<ApiResponse<User>> {
  return apiRequest<User>(`${API_BASE_URL}/v1/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function adminDeleteUser(id: string): Promise<ApiResponse<null>> {
  return apiRequest<null>(`${API_BASE_URL}/v1/admin/users/${id}`, { method: "DELETE" });
}
