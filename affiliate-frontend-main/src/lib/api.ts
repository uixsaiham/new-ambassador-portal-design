const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

// The admin panel and the ambassador portal run on the SAME origin, so they must
// NOT share a single token slot in localStorage — otherwise logging into one
// overwrites the other, and because localStorage is shared across tabs the two
// areas "bleed" into each other. Scope the token key by URL area so an admin tab
// and an ambassador tab hold completely independent sessions.
export function authTokenKey(): string {
  if (typeof window !== "undefined" && window.location.pathname.startsWith("/admin")) {
    return "bhe_admin_token";
  }
  return "bhe_token";
}
export function getAuthToken(): string | null {
  return typeof window !== "undefined" ? localStorage.getItem(authTokenKey()) : null;
}
export function setAuthToken(token: string): void {
  if (typeof window !== "undefined") localStorage.setItem(authTokenKey(), token);
}
export function clearAuthToken(): void {
  if (typeof window !== "undefined") localStorage.removeItem(authTokenKey());
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const token = getAuthToken();
  
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  let url = `${API_BASE_URL}${endpoint}`;
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    // Session expired or evicted (token no longer valid). Drop the dead token and,
    // if we're inside a protected area, bounce to the matching login with an
    // ?expired flag so the page can explain why they were signed out.
    if (response.status === 401 && typeof window !== "undefined") {
      const path = window.location.pathname;
      const hadToken = !!getAuthToken();
      clearAuthToken();
      if (hadToken) {
        if (path.startsWith("/admin") && path !== "/admin/login") {
          window.location.href = "/admin/login?expired=1";
        } else if (path.startsWith("/dashboard")) {
          window.location.href = "/login?expired=1";
        }
      }
    }
    let errorMessage = "An error occurred";
    try {
      const errorData = await response.json();
      const detail = (errorData as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        errorMessage = detail;
      } else if (Array.isArray(detail)) {
        // FastAPI/Pydantic validation errors: [{loc, msg, type}, ...]
        errorMessage = detail
          .map((d) => (d && typeof d === "object" && "msg" in d ? String((d as { msg: unknown }).msg) : String(d)))
          .join("; ");
      } else if (detail) {
        errorMessage = JSON.stringify(detail);
      } else {
        errorMessage = JSON.stringify(errorData);
      }
    } catch {
      errorMessage = response.statusText;
    }
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

// Authenticated binary download (PDF / zip). The JSON `request` helper above reads
// response.json(), so it can't handle binary bodies; this does a raw authenticated
// fetch, turns the response into a Blob and triggers a browser download. The
// filename is taken from the server's Content-Disposition when present, otherwise
// the supplied fallback.
export async function downloadFile(endpoint: string, fallbackName: string): Promise<void> {
  const token = getAuthToken();
  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE_URL}${endpoint}`, { headers });
  if (!res.ok) {
    let message = res.statusText || "Download failed";
    try {
      const data = await res.json();
      const detail = (data as { detail?: unknown }).detail;
      if (typeof detail === "string") message = detail;
      else if (detail) message = JSON.stringify(detail);
    } catch {
      /* non-JSON error body; keep statusText */
    }
    throw new Error(message);
  }

  const cd = res.headers.get("content-disposition") || "";
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(cd);
  const name = match ? decodeURIComponent(match[1].replace(/"/g, "")) : fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const api = {
  get: <T>(endpoint: string, params?: Record<string, string>, options?: RequestInit) =>
    request<T>(endpoint, { method: "GET", params, ...options }),
  post: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  put: <T>(endpoint: string, body?: unknown, options?: RequestInit) =>
    request<T>(endpoint, {
      method: "PUT",
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    request<T>(endpoint, { method: "DELETE", ...options }),
};
