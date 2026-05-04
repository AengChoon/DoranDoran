import type { Metadata } from "next";
import { Mascot } from "@/components/Mascot";

export const metadata: Metadata = {
  title: "확인 중",
};

export default function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  // TODO: 다음 단계에서 token으로 API /auth/verify 호출 → 쿠키 set → /feed로 redirect
  return (
    <main className="min-h-svh flex flex-col items-center justify-center gap-6 px-6">
      <Mascot variant="pair-thinking" size="lg" />
      <h1 className="text-2xl font-extrabold text-duo-text">확인하고 있어요…</h1>
      <p className="text-duo-text-muted font-bold text-sm">잠깐만 기다려주세요.</p>
    </main>
  );
}
