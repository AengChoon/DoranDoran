import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Mascot } from "@/components/Mascot";
import { Wordmark } from "@/components/Wordmark";
import { hasSessionCookie } from "@/lib/session";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "로그인",
};

export default async function LoginPage() {
  if (await hasSessionCookie()) {
    redirect("/feed");
  }
  return (
    <main className="min-h-svh flex items-center justify-center px-4 py-10 bg-linear-to-b from-duo-bg to-duo-green/5">
      <div className="w-full max-w-md mx-auto flex flex-col items-center gap-6">
        {/* 마스코트 + 워드마크는 한 묶음으로 가깝게 */}
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
