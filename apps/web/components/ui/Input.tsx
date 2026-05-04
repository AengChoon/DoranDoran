import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * 도란도란 입력창 — 듀오링고 톤.
 * 12px 라운드, 2px 보더, focus 시 보더만 파랑(링 없음).
 */
const inputBase =
  "w-full rounded-duo-sm border-2 border-duo-border bg-duo-bg " +
  "text-base font-semibold text-duo-text " +
  "placeholder:font-medium placeholder:text-duo-text-muted " +
  "transition-colors duration-150 " +
  "focus:outline-hidden focus:border-duo-blue " +
  "disabled:opacity-50";

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ className, ...rest }, ref) {
  return (
    <input
      ref={ref}
      className={cn(inputBase, "h-14 px-4", className)}
      {...rest}
    />
  );
});

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...rest }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn(inputBase, "min-h-[120px] px-4 py-3 resize-none", className)}
      {...rest}
    />
  );
});
