import type { ProblemDetailsLike } from "../types";

const API_PREFIX = import.meta.env.VITE_API_PREFIX ?? "/api";

class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function isApiErrorStatus(error: unknown, status: number): boolean {
  return error instanceof ApiError && error.status === status;
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = (contentType.includes("application/json") || contentType.includes("+json"))
    ? ((await response.json()) as ProblemDetailsLike | T)
    : undefined;

  if (!response.ok) {
    const problem = payload as ProblemDetailsLike | undefined;
    throw new ApiError(
      problem?.detail ?? problem?.title ?? "Beklenmeyen bir hata olustu.",
      response.status,
    );
  }

  return payload as T;
}

export async function requestText(path: string, init?: RequestInit) {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";
    const problem = contentType.includes("application/json") || contentType.includes("+json")
      ? ((await response.json()) as ProblemDetailsLike)
      : undefined;

    throw new ApiError(
      problem?.detail ?? problem?.title ?? "Beklenmeyen bir hata olustu.",
      response.status,
    );
  }

  return {
    text: await response.text(),
    contentType: response.headers.get("content-type") ?? "text/plain",
    fileName: getFileName(response.headers.get("content-disposition")),
  };
}

function getFileName(contentDisposition: string | null) {
  if (!contentDisposition) {
    return null;
  }

  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1].replace(/^"|"$/g, ""));
  }

  const fileNameMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return fileNameMatch?.[1] ?? null;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Beklenmeyen bir hata olustu.";
}
