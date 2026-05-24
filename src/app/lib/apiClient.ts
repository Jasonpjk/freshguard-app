const BACKEND_MODE = import.meta.env.VITE_BACKEND_MODE as string | undefined;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string | undefined;

// Returns true only when VITE_BACKEND_MODE=api AND VITE_API_BASE_URL is present
export function isApiEnabled(): boolean {
  return BACKEND_MODE === "api" && !!API_BASE_URL;
}

// ─── Token management ─────────────────────────────────────────────────────────

let _token: string | null = null;

export function setApiToken(token: string | null): void {
  _token = token;
  if (token) {
    localStorage.setItem("fg_api_token", token);
  } else {
    localStorage.removeItem("fg_api_token");
  }
}

export function getApiToken(): string | null {
  if (_token) return _token;
  const stored = localStorage.getItem("fg_api_token");
  if (stored) {
    _token = stored;
  }
  return _token;
}

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

interface RequestOptions {
  method?: string;
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
  skipAuth?: boolean;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const base = API_BASE_URL?.replace(/\/$/, "") ?? "";
  let url = `${base}${path}`;

  if (options.params) {
    const qs = Object.entries(options.params)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
      .join("&");
    if (qs) url += `?${qs}`;
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!options.skipAuth) {
    const token = getApiToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const init: RequestInit = {
    method: options.method ?? "GET",
    headers,
  };

  if (options.body !== undefined) {
    init.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, init);

  if (res.status === 401) {
    setApiToken(null);
    throw new ApiError(401, "인증이 만료되었습니다. 다시 로그인해 주세요.");
  }

  if (!res.ok) {
    let message = `API 오류 (${res.status})`;
    try {
      const json = await res.json();
      message = json?.detail ?? json?.message ?? message;
    } catch {
      // ignore JSON parse error
    }
    throw new ApiError(res.status, message);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;

  return res.json() as Promise<T>;
}

// ─── Public helpers ───────────────────────────────────────────────────────────

export function apiGet<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>
): Promise<T> {
  return request<T>(path, { params });
}

export function apiPost<T>(path: string, body?: unknown, opts?: { skipAuth?: boolean }): Promise<T> {
  return request<T>(path, { method: "POST", body, skipAuth: opts?.skipAuth });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "PATCH", body });
}

export function apiPut<T>(path: string, body?: unknown): Promise<T> {
  return request<T>(path, { method: "PUT", body });
}

export function apiDelete<T = void>(path: string): Promise<T> {
  return request<T>(path, { method: "DELETE" });
}
