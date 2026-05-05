"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { Mascot } from "@/components/Mascot";
import { Wordmark } from "@/components/Wordmark";
import { useMe } from "@/lib/api/me";
import { LoginForm } from "./LoginForm";

const REPO_URL = "https://github.com/AengChoon/DoranDoran";

// lucide-react가 브랜드 아이콘을 제거해서 inline SVG (Mark은 GitHub 공식 mark, MIT)
function GithubMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.4 3-.405 1.02.005 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
    </svg>
  );
}

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
    <main className="h-full flex flex-col bg-linear-to-b from-duo-bg to-duo-green/5">
      <div className="flex-1 flex items-center justify-center px-4 py-10">
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
        </div>
      </div>

      <footer className="flex justify-center pb-[max(1rem,env(safe-area-inset-bottom))]">
        <a
          href={REPO_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="GitHub repository"
          className="text-duo-text-muted hover:text-duo-text transition-colors p-2"
        >
          <GithubMark className="h-5 w-5" />
        </a>
      </footer>
    </main>
  );
}
