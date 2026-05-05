"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/api/me";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * (app) 영역 클라이언트 측 인증 가드.
 *
 * 정적 export로 호스팅하므로 서버 측 cookie 체크가 불가능.
 * /auth/me로 본인 정보를 확인하고:
 *   - 로딩 중 → skeleton
 *   - 401 / user 없음 → /login
 *   - OK → children 렌더
 *
 * apiFetch가 401 응답 시 자체적으로 /login으로 redirect — 여기선 보강.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const me = useMe();

  React.useEffect(() => {
    if (me.isLoading) return;
    if (!me.user) router.replace("/login");
    else if (me.user.onboardedAt == null) router.replace("/onboarding");
  }, [me.isLoading, me.user, router]);

  if (me.isLoading || !me.user || me.user.onboardedAt == null) {
    return (
      <main className="max-w-md mx-auto px-4 py-4">
        <div className="flex flex-col gap-3">
          <Skeleton className="h-24 w-3/4 ml-auto" />
          <Skeleton className="h-24 w-3/4" />
          <Skeleton className="h-32 w-3/4 ml-auto" />
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
