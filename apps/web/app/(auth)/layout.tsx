/**
 * 인증 라우트 공통 레이아웃 — login, verify.
 *
 * h-svh + overflow-hidden — PWA standalone 모드에서 페이지 스크롤 차단.
 * (app) 레이아웃과 동일 패턴.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="h-svh overflow-hidden">{children}</div>;
}
