import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badge = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide",
  {
    variants: {
      tone: {
        ko: "bg-doran-warm/10 text-doran-warm-dark border-2 border-doran-warm/30",
        ja: "bg-doran-soft/20 text-doran-soft-dark border-2 border-doran-soft/40",
        green: "bg-duo-green/10 text-duo-green-dark border-2 border-duo-green/30",
        blue: "bg-duo-blue/10 text-duo-blue-dark border-2 border-duo-blue/30",
        gray: "bg-duo-bg-muted text-duo-text-muted border-2 border-duo-border",
      },
    },
    defaultVariants: { tone: "gray" },
  },
);

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badge>;

export function Badge({ className, tone, ...rest }: BadgeProps) {
  return <span className={cn(badge({ tone }), className)} {...rest} />;
}

export function LangBadge({ lang }: { lang: "ko" | "ja" }) {
  if (lang === "ko") {
    return <Badge tone="ko">한국어</Badge>;
  }
  return <Badge tone="ja">일본어</Badge>;
}
