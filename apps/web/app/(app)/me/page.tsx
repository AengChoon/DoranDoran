"use client";
import { Mascot } from "@/components/Mascot";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMe } from "@/lib/api/me";
import { LogoutButton } from "./LogoutButton";

/**
 * "나" 페이지 — 본인 프로필 + 로그아웃.
 *
 * 정적 export 호스팅 — useMe로 클라이언트 측 fetch.
 * AuthGuard가 (app) 레이아웃 단에서 인증 체크 — 여기 도달했으면 user 있음 가정.
 */
export default function MePage() {
  const me = useMe();

  if (me.isLoading || !me.user) {
    return (
      <main className="max-w-md mx-auto px-4 py-10 flex flex-col items-center gap-6">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-32 w-full" />
      </main>
    );
  }

  const user = me.user;

  return (
    <main className="max-w-md mx-auto px-4 py-10 flex flex-col items-center gap-6">
      <Mascot variant="pair" size="md" />

      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-duo-text">
          {user.displayName}
        </h1>
        <p className="mt-1 text-sm text-duo-text-muted">{user.email}</p>
      </div>

      <div className="card-duo w-full">
        <Row label="학습 언어">
          {user.learningLang === "ja" ? "일본어" : "한국어"}
        </Row>
        <Row label="모국어">
          {user.nativeLang === "ja" ? "일본어" : "한국어"}
        </Row>
      </div>

      <LogoutButton />
    </main>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-duo-border last:border-b-0">
      <span className="text-sm font-bold text-duo-text-muted">{label}</span>
      <span className="text-sm font-extrabold text-duo-text">{children}</span>
    </div>
  );
}
