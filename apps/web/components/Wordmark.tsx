"use client";
import { useLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

/**
 * "도란도란" / "ドランドラン" 워드마크.
 *
 * 메인(큰 글씨, --duo-green) + 보조(작은 글씨, muted) 2단.
 * primary가 위(메인). 미지정 시 LocaleProvider 현재 locale 따름.
 */
export function Wordmark({
  className,
  size = "lg",
  showSub = true,
  primary,
}: {
  className?: string;
  size?: "md" | "lg" | "xl";
  showSub?: boolean;
  primary?: Locale;
}) {
  const { locale } = useLocale();
  const top: Locale = primary ?? locale;
  const bot: Locale = top === "ko" ? "ja" : "ko";

  const main = {
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-6xl",
  }[size];
  // 보조 — 메인의 약 절반
  const sub = {
    md: "text-base",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  const TEXT: Record<Locale, string> = {
    ko: "도란도란",
    ja: "ドランドラン",
  };

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <h1
        lang={top}
        className={cn("font-display leading-none text-duo-green", main)}
        style={{ fontWeight: 900, letterSpacing: "-0.02em" }}
      >
        {TEXT[top]}
      </h1>
      {showSub && (
        <p
          lang={bot}
          className={cn("mt-1 text-duo-text-muted", sub)}
          style={{ fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          {TEXT[bot]}
        </p>
      )}
    </div>
  );
}
