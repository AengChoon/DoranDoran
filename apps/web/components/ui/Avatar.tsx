import * as React from "react";
import { cn } from "@/lib/cn";

export type AvatarProps = {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  /** 이니셜 배경색 — src가 없을 때 사용 */
  bg?: string;
  className?: string;
};

const sizeMap = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-base",
} as const;

export function Avatar({ name, src, size = "md", bg, className }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      className={cn(
        "inline-flex items-center justify-center rounded-full",
        "border-2 border-white overflow-hidden shrink-0",
        "font-extrabold text-white",
        sizeMap[size],
        className,
      )}
      style={bg && !src ? { backgroundColor: bg } : undefined}
      aria-label={name}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span>{initial}</span>
      )}
    </div>
  );
}
