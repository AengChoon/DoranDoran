import { redirect } from "next/navigation";
import { hasSessionCookie } from "@/lib/session";
import { NewCardFab } from "./NewCardFab";
import { TabBar } from "./TabBar";

/**
 * 로그인 후 영역의 공통 레이아웃.
 * 세션 쿠키 없으면 로그인으로.
 *
 * 카드 상세는 별도 라우트 없이 /feed?card=<id> 쿼리로 모달이 열림 (FeedPage 내부에서 처리).
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!(await hasSessionCookie())) {
    redirect("/login");
  }
  return (
    <div className="h-svh overflow-hidden">
      {children}
      <NewCardFab />
      <TabBar />
    </div>
  );
}
