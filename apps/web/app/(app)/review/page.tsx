import type { Metadata } from "next";
import { Mascot } from "@/components/Mascot";

export const metadata: Metadata = {
  title: "복습",
};

export default function ReviewPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-12 flex flex-col items-center text-center">
      <Mascot variant="pair" size="lg" />
      <h1 className="mt-6 text-2xl font-extrabold text-duo-text">
        복습은 다음 단계
      </h1>
      <p className="mt-2 text-base text-duo-text-muted">
        SM-2 알고리즘 플래시카드가 들어올 자리.
      </p>
    </main>
  );
}
