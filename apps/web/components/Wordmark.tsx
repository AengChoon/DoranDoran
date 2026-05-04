import { cn } from "@/lib/cn";

/**
 * "도란도란" 워드마크.
 * 한글 메인 (Nunito 900, 통통, --duo-green), 가타카나 보조 (700, 절반 사이즈, muted).
 */
export function Wordmark({
  className,
  size = "lg",
  showSub = true,
}: {
  className?: string;
  size?: "md" | "lg" | "xl";
  showSub?: boolean;
}) {
  const main = {
    md: "text-3xl",
    lg: "text-5xl",
    xl: "text-6xl",
  }[size];
  // 가타카나 — 메인의 약 절반 사이즈
  const sub = {
    md: "text-base",
    lg: "text-2xl",
    xl: "text-3xl",
  }[size];

  return (
    <div className={cn("flex flex-col items-center", className)}>
      <h1
        className={cn(
          "font-display leading-none text-duo-green",
          main,
        )}
        style={{ fontWeight: 900, letterSpacing: "-0.02em" }}
      >
        도란도란
      </h1>
      {showSub && (
        <p
          className={cn("mt-1 text-duo-text-muted", sub)}
          style={{ fontWeight: 700, letterSpacing: "-0.01em" }}
        >
          ドランドラン
        </p>
      )}
    </div>
  );
}
