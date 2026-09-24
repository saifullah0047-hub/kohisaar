const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000/api/v1";

import { adminDemoResponse } from "@/lib/admin-demo-data";

/* ------------------------------------------------------------------ */
/*  Lightweight admin API client                                       */
/* ------------------------------------------------------------------ */

export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public body?: unknown,
  ) {
    super(`API ${status}: ${statusText}`);
    this.name = "ApiError";
  }
}

async function request<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (options.method || process.env.NEXT_PUBLIC_ADMIN_DEMO_MOCKS === "false") throw error;
    const mock = adminDemoResponse(endpoint);
    if (mock) return mock as T;
    throw error;
  }

  if (!response.ok) {
    if (!options.method && process.env.NEXT_PUBLIC_ADMIN_DEMO_MOCKS !== "false") {
      const mock = adminDemoResponse(endpoint);
      if (mock) return mock as T;
    }
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      /* empty */
    }
    throw new ApiError(response.status, response.statusText, body);
  }

  /* 204 No Content */
  if (response.status === 204) return undefined as T;

  const result = await response.json() as T;
  if (!options.method && process.env.NEXT_PUBLIC_ADMIN_DEMO_MOCKS !== "false") {
    const data = (result as { data?: unknown })?.data;
    const mock = adminDemoResponse(endpoint);
    const isEmpty = Array.isArray(data) ? data.length === 0 : endpoint === "/admin/dashboard" && (!data || Object.values(data as Record<string, unknown>).every((value) => value === 0 || (Array.isArray(value) && value.length === 0)));
    if (mock && isEmpty) return mock as T;
  }
  return result;
}

export const adminApi = {
  get: <T = unknown>(endpoint: string, signal?: AbortSignal) =>
    request<T>(endpoint, { signal }),

  post: <T = unknown>(endpoint: string, body?: unknown) =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  patch: <T = unknown>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),

  put: <T = unknown>(endpoint: string, body: unknown) =>
    request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    }),

  delete: <T = unknown>(endpoint: string) =>
    request<T>(endpoint, { method: "DELETE" }),
};
