/**
 * 가벼운 fetch wrapper. /api/* 경로로 보내면 next.config rewrites가 API 서버로.
 * 같은 origin이라 쿠키 자동 전송.
 *
 * 401 응답 시 자동으로 /login으로 리다이렉트 (서버가 쿠키 클리어해서 보냄).
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`/api${path}`, {
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
