"use client";
import * as React from "react";
import { X } from "lucide-react";
import { CardDetail } from "@/components/card/CardDetail";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCard } from "@/lib/api/cards";
import { useMe } from "@/lib/api/me";
import { cn } from "@/lib/cn";

type Props = {
  /** 열린 카드 id. null이면 닫힌 상태. */
  cardId: string | null;
  onClose: () => void;
};

/**
 * 카드 상세 바텀 시트 모달 — Duolingo 톤.
 *
 *  - cardId가 들어오면 슬라이드업 + 페이드인으로 등장
 *  - ESC / 배경 탭 / 닫기 버튼으로 닫힘
 *  - 배경 스크롤 잠금
 *  - 시트 안에서 자체 스크롤
 *  - 향후 풀스크린 확장 등 자유
 */
export function CardDetailModal({ cardId, onClose }: Props) {
  // 마운트 직후 한 프레임 뒤에 transform 해제 → 슬라이드업
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    if (!cardId) {
      setShown(false);
      return;
    }
    const t = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(t);
  }, [cardId]);

  // ESC 닫기 + 배경 스크롤 잠금
  React.useEffect(() => {
    if (!cardId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [cardId, onClose]);

  if (!cardId) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-30 bg-black/40 transition-opacity duration-200",
        shown ? "opacity-100" : "opacity-0",
      )}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="카드 상세"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "absolute bottom-0 left-0 right-0 mx-auto max-w-md max-h-[92dvh]",
          "flex flex-col",
          "bg-duo-bg border-t-2 border-x-2 border-duo-border",
          "rounded-t-duo-lg shadow-duo-card",
          "transition-transform duration-200 ease-out",
          shown ? "translate-y-0" : "translate-y-full",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {/* 닫기 버튼 — 시트 우상단에 absolute로 띄움 */}
        <button
          type="button"
          onClick={onClose}
          aria-label="닫기"
          className={cn(
            "absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center rounded-full",
            "bg-white text-duo-text border-2 border-duo-border",
            "shadow-[0_3px_0_0_#E5E5E5] hover:bg-duo-bg-muted hover:brightness-105",
            "active:translate-y-[2px] active:shadow-[0_0_0_0_#E5E5E5]",
            "transition-[transform,box-shadow,filter] duration-100",
          )}
        >
          <X className="h-5 w-5" strokeWidth={3} />
        </button>

        {/* 본문 — 시트 안에서 자체 스크롤. 우상단 닫기 버튼 가리지 않게 우측 패딩 여유. */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 pt-5 pb-6">
          <CardModalBody cardId={cardId} onAfterDelete={onClose} />
        </div>
      </div>
    </div>
  );
}

function CardModalBody({
  cardId,
  onAfterDelete,
}: {
  cardId: string;
  onAfterDelete: () => void;
}) {
  const meQuery = useMe();
  const card = useCard(cardId);

  if (card === undefined || meQuery.isLoading) {
    return <Skeleton className="h-40 w-full" />;
  }
  if (card === null) {
    return (
      <p className="text-center text-duo-text-muted py-8">
        카드를 찾을 수 없어요.
      </p>
    );
  }
  return (
    <CardDetail
      card={card}
      me={meQuery.user}
      onAfterDelete={onAfterDelete}
      editRedirectTo={`/feed?card=${cardId}`}
    />
  );
}
