"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/cn";

/** 이 경로에선 FAB 숨김 — 작성 페이지/편집/로그인 등에선 의미 없음 */
const HIDDEN_PREFIXES = ["/new", "/login", "/verify"];

/**
 * 카드 작성 플로팅 액션 버튼.
 * 탭바 위에 떠 있는 초록 원형 버튼, 듀오링고 그림자.
 *
 * /feed?card=<id> 모달 열린 동안에도 숨김.
 */
export function NewCardFab() {
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  if (HIDDEN_PREFIXES.some((p) => pathname.startsWith(p))) return null;
  if (searchParams.get("card")) return null;

  return (
    <Link
      href="/new"
      aria-label="카드 작성"
      className={cn(
        "fixed right-4 z-30 flex h-14 w-14 items-center justify-center",
        "rounded-full bg-duo-green text-white",
        "shadow-[0_4px_0_0_#58A700] hover:brightness-105",
        "active:translate-y-[2px] active:shadow-[0_0_0_0_#58A700]",
        "transition-[transform,box-shadow,filter] duration-100",
      )}
      style={{
        bottom: "calc(76px + env(safe-area-inset-bottom))",
      }}
    >
      <Pencil className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
