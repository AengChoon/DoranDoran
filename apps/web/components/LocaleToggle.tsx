"use client";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * 작은 언어 토글 — 현재 locale의 "반대" 언어로 한 번에 전환.
 * login/onboarding 헤더에 두기 위한 미니 버튼.
 */
export function LocaleToggle({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const next = locale === "ko" ? "ja" : "ko";
  // 보여줄 라벨은 "전환할 쪽" — ko 화면이면 "日本語", ja 화면이면 "한국어"
  const label = next === "ja" ? "日本語" : "한국어";
  const aria = locale === "ko" ? "言語切り替え (日本語へ)" : "언어 변경 (한국어로)";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={aria}
      lang={next}
      className={cn(
        "inline-flex h-8 px-3 items-center justify-center rounded-full",
        "bg-white border-2 border-duo-border text-duo-text-muted",
        "text-xs font-extrabold tracking-tight",
        "shadow-[0_3px_0_0_#C5C5C5] active:translate-y-[1px] active:shadow-[0_0_0_0_#C5C5C5]",
        "hover:text-duo-text transition-[transform,box-shadow] duration-100",
        className,
      )}
    >
      {label}
    </button>
  );
}
