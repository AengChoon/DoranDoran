"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/Mascot";
import { Wordmark } from "@/components/Wordmark";
import { useMe } from "@/lib/api/me";
import { LoginForm } from "./LoginForm";

/**
 * 로그인 페이지.
 *
 * 정적 export 호스팅 — 서버 측 redirect 불가. 클라이언트에서 /auth/me 호출하고
 * 이미 로그인 상태면 /feed로 redirect.
 *
 * metadata는 정적 export 시 Next.js가 build-time에 추출 — 'use client'에선 못 export.
 * 그래서 별도 layout 또는 head 처리는 추후 (현재는 root layout의 metadata만).
 */
export default function LoginPage() {
  const router = useRouter();
  const me = useMe();

  React.useEffect(() => {
    if (me.user) router.replace("/feed");
  }, [me.user, router]);

  return (
    <main className="h-full flex items-center justify-center px-4 py-10 bg-linear-to-b from-duo-bg to-duo-green/5">
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <div className="animate-bounce-soft">
            <Mascot variant="pair" size="xl" />
          </div>
          <Wordmark size="xl" />
        </div>

        <p className="text-center text-duo-text text-base leading-relaxed">
          오늘도 둘이서 도란도란.
          <br />
          이메일 한 줄이면 시작할 수 있어요.
        </p>

        <div className="w-full mt-2">
          <LoginForm />
        </div>

        <p className="mt-2 text-sm text-duo-text-muted text-center leading-relaxed">
          💌 입력하신 메일로 로그인 링크를 보내드려요
          <br />
          둘만의 공간이라 등록된 메일만 들어올 수 있어요
        </p>
      </div>
    </main>
  );
}
