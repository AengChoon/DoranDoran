"use client";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type Props = {
  /** 라벨 — 기본 "뒤로" */
  label?: string;
  /** 히스토리가 없을 때 폴백 URL — 기본 /feed */
  fallback?: string;
  /** 커스텀 클릭 동작 (편집 모드 토글 같은 비-네비게이션 케이스) */
  onClick?: () => void;
  className?: string;
};

/**
 * 뒤로가기 버튼 — 듀오링고 ghost 스타일.
 *
 * 우선순위:
 *  1. props.onClick 있으면 그대로 호출
 *  2. 브라우저 히스토리 있으면 router.back()
 *  3. 없으면 fallback 경로로 push
 */
export function BackButton({
  label = "뒤로",
  fallback = "/feed",
  onClick,
  className,
}: Props) {
  const router = useRouter();

  function handle() {
    if (onClick) {
      onClick();
      return;
    }
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallback);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handle}
      aria-label={label}
      className={cn("gap-1.5", className)}
    >
      <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
      {label}
    </Button>
  );
}
