"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/lib/api/me";
import { Mascot } from "@/components/Mascot";

/**
 * 루트 페이지 — 세션이 있으면 /feed, 없으면 /login.
 * 정적 export 호환 위해 클라이언트 측에서 /auth/me 결과로 분기.
 */
export default function HomePage() {
  const router = useRouter();
  const me = useMe();

  React.useEffect(() => {
    if (me.isLoading) return;
    if (me.user) router.replace("/feed");
    else router.replace("/login");
  }, [me.isLoading, me.user, router]);

  return (
    <main className="min-h-svh flex items-center justify-center">
      <Mascot variant="pair-thinking" size="md" />
    </main>
  );
}
