import { API_BASE_URL, API_TIMEOUT_MS, IS_API_CONFIGURED } from "./config";

export class ApiError extends Error {
  status: number;
  type?: 'AUTH_REQUIRED' | 'NETWORK_ERROR' | 'SERVER_ERROR' | undefined;
  constructor(message: string, status: number, type?: ApiError['type']) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.type = type;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  signal?: AbortSignal;
};

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const url = `${API_BASE_URL}${path}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.append(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/** Single entry point for every HTTP call to the Teryaq SQL Connector API. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  if (!IS_API_CONFIGURED) {
    throw new ApiError("لم يتم ضبط عنوان الـ API (VITE_API_BASE_URL).", 0);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl(path, options.query), {
      method: options.method ?? "GET",
      headers: { Accept: "application/json", "Content-Type": "application/json" },
      body: options.body === undefined ? null : JSON.stringify(options.body),
      signal: options.signal ?? controller.signal,
      credentials: "include", // Required for Cloudflare Access browser session
    });

    const contentType = response.headers.get("content-type") || "";

    // Cloudflare Access redirects to a login page (text/html) when unauthenticated
    if (contentType.includes("text/html") || response.redirected) {
      throw new ApiError("يتطلب تسجيل الدخول إلى Cloudflare", 401, "AUTH_REQUIRED");
    }

    if (!response.ok) {
      throw new ApiError(`فشل الطلب: ${response.status}`, response.status, "SERVER_ERROR");
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(err.message || "خطأ في الشبكة", 0, "NETWORK_ERROR");
  } finally {
    clearTimeout(timeout);
  }
}