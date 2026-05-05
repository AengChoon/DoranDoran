"use client";
import * as React from "react";
import type { CardWithMeta } from "@dorandoran/shared";
import { CardView } from "@/components/card/CardView";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type Props = {
  card: CardWithMeta;
  /** article footer 우측에 끼울 컨트롤 (수정/삭제 아이콘 등) — 첨삭본 페이지에 표시 */
  trailing?: React.ReactNode;
};

/**
 * 첨삭본 / 원본 좌우 슬라이드.
 *
 * 기본 랜딩 = 첨삭본 (학습 대상). swipe로 원본 비교.
 * scroll-snap-x mandatory + 상단 segmented control (탭으로 전환).
 */
export function CardCarousel({ card, trailing }: Props) {
  const t = useT();
  const scrollerRef = React.useRef<HTMLDivElement>(null);
  const [page, setPage] = React.useState<0 | 1>(0); // 0=첨삭본, 1=원본

  // 스크롤 위치 변경 감지 → page 업데이트
  React.useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const idx = Math.round(el.scrollLeft / el.clientWidth);
      setPage(idx === 1 ? 1 : 0);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  function jumpTo(idx: 0 | 1) {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollTo({ left: idx * el.clientWidth, behavior: "smooth" });
  }

  return (
    <div>
      {/* segmented control — 탭으로도 페이지 전환 가능 */}
      <div className="mb-3 inline-flex items-center gap-1 rounded-full bg-duo-bg-muted p-1 text-xs font-extrabold">
        <SegBtn active={page === 0} onClick={() => jumpTo(0)}>
          {t.card.corrected}
        </SegBtn>
        <SegBtn active={page === 1} onClick={() => jumpTo(1)}>
          {t.card.original}
        </SegBtn>
      </div>

      <div
        ref={scrollerRef}
        className="flex overflow-x-auto snap-x snap-mandatory -mx-4 px-4 no-scrollbar"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <div className="snap-start shrink-0 basis-full pr-3">
          <CardView card={card} mode="corrected" trailing={trailing} />
        </div>
        <div className="snap-start shrink-0 basis-full pl-3">
          <CardView card={card} mode="original" />
        </div>
      </div>
    </div>
  );
}

function SegBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 px-3 rounded-full transition-colors",
        active
          ? "bg-white text-duo-text shadow-[0_2px_0_0_#E5E5E5]"
          : "text-duo-text-muted",
      )}
    >
      {children}
    </button>
  );
}
