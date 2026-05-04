import { cookies } from "next/headers";

const COOKIE_NAME = "doran_session";

/**
 * 서버 컴포넌트에서 세션 쿠키 존재 여부만 확인.
 * JWT 검증은 API에서 수행 — 여기선 cheap한 게이트만.
 * 무효 토큰이면 이후 API 호출이 401로 실패하고 그때 로그아웃 처리.
 */
export async function hasSessionCookie(): Promise<boolean> {
  const c = await cookies();
  return c.has(COOKIE_NAME);
}
