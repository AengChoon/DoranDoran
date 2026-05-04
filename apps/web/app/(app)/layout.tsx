import { Suspense } from "react";
import { AuthGuard } from "./AuthGuard";
import { NewCardFab } from "./NewCardFab";
import { TabBar } from "./TabBar";

/**
 * 로그인 후 영역의 공통 레이아웃.
 *
 * 정적 export 호스팅 — 서버 측 cookie 체크 X. 클라이언트 AuthGuard가
 * /auth/me로 세션 확인하고 미인증이면 /login으로 redirect.
 *
 * 카드 상세는 별도 라우트 없이 /feed?card=<id> 쿼리로 모달이 열림 (FeedPage 내부에서 처리).
 *
 * Suspense — useSearchParams를 쓰는 자식 컴포넌트(FeedPage, NewCardFab)들이
 * 정적 export prerender 시 boundary를 요구. fallback null은 첫 렌더 frame만 비움.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-svh overflow-hidden">
      <AuthGuard>
        <Suspense fallback={null}>{children}</Suspense>
      </AuthGuard>
      <Suspense fallback={null}>
        <NewCardFab />
      </Suspense>
      <TabBar />
    </div>
  );
}
