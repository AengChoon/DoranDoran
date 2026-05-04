import type { Metadata } from "next";
import { CardForm } from "@/components/card/CardForm";
import { BackButton } from "@/components/ui/BackButton";

export const metadata: Metadata = {
  title: "카드 작성",
};

export default function NewCardPage() {
  return (
    <main className="max-w-md mx-auto px-4 py-6">
      <BackButton fallback="/feed" label="피드" className="mb-4" />
      <h1 className="text-2xl font-extrabold text-duo-text mb-1">
        오늘 배운 표현
      </h1>
      <p className="text-sm text-duo-text-muted mb-6">
        한 줄이면 충분해요. 원어민이 확인해 줄 거예요.
      </p>
      <CardForm mode={{ kind: "create" }} redirectTo="/feed" />
    </main>
  );
}
