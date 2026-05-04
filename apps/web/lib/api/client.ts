/**
 * 가벼운 fetch wrapper. NEXT_PUBLIC_API_BASE로 직접 호출 (정적 export 호환).
 * cross-origin이지만 같은 root domain이라 SameSite=Lax 쿠키 그대로 동작.
 *
 * 401 응답 시 자동으로 /login으로 리다이렉트 (서버가 쿠키 클리어해서 보냄).
 */
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8787";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login")) {
      // 세션 만료/무효 → 로그인으로 (쿠키는 서버가 이미 정리)
      window.location.href = "/login";
    }
    throw new ApiError(401, "unauthorized");
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ApiError(res.status, text || res.statusText);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}
