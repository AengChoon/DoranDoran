import * as React from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import type { CardWithMeta } from "@dorandoran/shared";
import { Furigana } from "@/components/card/Furigana";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { cn } from "@/lib/cn";

type Props = {
  card: CardWithMeta;
  isMine: boolean;
  /** 검색 매치 카드 — 옅은 노란 ring */
  isMatch?: boolean;
  /** 현재 포커스된 매치 카드 — 강한 노란 ring + 글로우 */
  isCurrent?: boolean;
};

/**
 * 피드 카드 한 개 — 채팅 말풍선 스타일.
 *
 * 첨삭본이 있으면 그 텍스트를 우선 노출 (학습자가 "고친 결과"를 바로 보게).
 * 시각 상태:
 *   - 대기  → 보더 점선
 *   - 확인됨 (그대로 OK 또는 첨삭됨) → 보더 솔리드 + ✓ 배지
 */
export const CardItem = React.memo(CardItemImpl);

function CardItemImpl({
  card,
  isMine,
  isMatch,
  isCurrent,
}: Props) {
  const meaningLang = card.lang === "ko" ? "ja" : "ko";
  const isConfirmed = card.confirmedAt !== null;

  // 첨삭본 있으면 그쪽 우선. furigana는 첨삭자가 새로 매핑한 게 있으면 사용.
  const target = card.correction?.target?.text ?? card.targetText;
  const targetFurigana =
    card.correction?.target?.furigana !== undefined
      ? card.correction.target.furigana
      : (card.furigana ?? null);
  const meaning = card.correction?.meaning?.text ?? card.meaning;
  const hasFurigana = !!targetFurigana && targetFurigana.length > 0;

  return (
    <Link
      href={`/feed?card=${card.id}`}
      className={cn(
        "relative block rounded-duo border-2 px-4 py-3 max-w-[85%]",
        "transition-[transform,box-shadow] duration-150",
        "active:translate-y-0.5 active:shadow-none",
        "scroll-mt-20",
        isConfirmed ? "border-solid" : "border-dashed",
        isMine
          ? "bg-[#F0FDE4] border-[#C8E6A8] ml-auto shadow-[0_3px_0_0_#C8E6A8] hover:shadow-[0_4px_0_0_#C8E6A8] hover:-translate-y-0.5"
          : "bg-white border-duo-border mr-auto shadow-[0_3px_0_0_#E5E5E5] hover:shadow-[0_4px_0_0_#E5E5E5] hover:-translate-y-0.5",
        isMatch &&
          !isCurrent &&
          "ring-2 ring-duo-yellow/50 ring-offset-2 ring-offset-duo-bg",
        isCurrent &&
          "ring-4 ring-duo-yellow ring-offset-2 ring-offset-duo-bg scale-[1.02]",
      )}
    >
      <h3
        lang={card.lang}
        className={cn(
          "text-2xl text-duo-text wrap-break-word",
          hasFurigana ? "leading-[1.85]" : "leading-snug",
        )}
        style={{ fontWeight: 800, letterSpacing: "normal" }}
      >
        <Furigana text={target} parts={targetFurigana} />
      </h3>

      <p
        lang={meaningLang}
        className="mt-1 text-base font-semibold text-duo-text-muted leading-snug wrap-break-word"
      >
        {meaning}
      </p>

      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-duo-text-muted/80">
        <RelativeTime ts={card.createdAt} />
      </div>

      {isConfirmed && (
        <span
          className={cn(
            "absolute -top-2 flex h-6 w-6 items-center justify-center",
            "rounded-full bg-duo-green text-white border-2 border-white",
            "shadow-[0_2px_0_0_#58A700]",
            isMine ? "-right-2" : "-left-2",
          )}
          aria-label="원어민 확인됨"
          title="원어민 확인됨"
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3} />
        </span>
      )}

      <span
        aria-hidden
        className={cn(
          "absolute h-3 w-3 rotate-45 border-2",
          isConfirmed ? "border-solid" : "border-dashed",
          isMine
            ? "bg-[#F0FDE4] border-[#C8E6A8] right-[-7px] bottom-4 border-l-0 border-b-0"
            : "bg-white border-duo-border left-[-7px] bottom-4 border-t-0 border-r-0",
        )}
      />
    </Link>
  );
}
