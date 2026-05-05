/**
 * 인증 라우트 공통 레이아웃 — login, verify.
 *
 * h-dvh + overflow-hidden — 모바일 브라우저 주소바 동적 영역(dvh)에 맞춰
 * viewport 잠금. svh로 하면 body(min-h-dvh)와 차이가 생겨 스크롤 발생.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-dvh overflow-hidden">{children}</div>;
}
