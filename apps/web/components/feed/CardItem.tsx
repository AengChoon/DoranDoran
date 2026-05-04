import * as React from "react";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { Furigana } from "@/components/card/Furigana";
import { cn } from "@/lib/cn";
import type { FeedCard } from "@/lib/types";

type Props = {
  card: FeedCard;
  isMine: boolean;
  /** 검색 매치 카드 — 옅은 노란 ring */
  isMatch?: boolean;
  /** 현재 포커스된 매치 카드 — 강한 노란 ring + 글로우 */
  isCurrent?: boolean;
};

/**
 * 피드 카드 한 개 — 채팅 말풍선 스타일.
 *
 * 시각 상태 (글자 없이):
 *   - 대기  → 보더 점선 (dashed)
 *   - 확인됨 → 보더 솔리드 + 코너에 ✓ 배지
 *
 * 후리가나는 furigana 필드가 있으면 <ruby><rt> 태그로 렌더.
 * 말풍선 꼬리는 카드 사이드(우측/좌측)에 작은 회전된 사각형으로.
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
  const hasFurigana = !!card.furigana && card.furigana.length > 0;

  return (
    <Link
      href={`/feed?card=${card.id}`}
      className={cn(
        "relative block rounded-duo border-2 px-4 py-3 max-w-[85%]",
        "transition-[transform,box-shadow] duration-150",
        "active:translate-y-0.5 active:shadow-none",
        "scroll-mt-20",
        // 대기 = 점선, 확인됨 = 솔리드
        isConfirmed ? "border-solid" : "border-dashed",
        isMine
          ? "bg-[#F0FDE4] border-[#C8E6A8] ml-auto shadow-[0_3px_0_0_#C8E6A8] hover:shadow-[0_4px_0_0_#C8E6A8] hover:-translate-y-0.5"
          : "bg-white border-duo-border mr-auto shadow-[0_3px_0_0_#E5E5E5] hover:shadow-[0_4px_0_0_#E5E5E5] hover:-translate-y-0.5",
        // 검색 매치 — 노란 ring (offset으로 카드 밖에 그려짐)
        isMatch &&
          !isCurrent &&
          "ring-2 ring-duo-yellow/50 ring-offset-2 ring-offset-duo-bg",
        // 현재 포커스 매치 — 강한 노란 ring + 살짝 확대
        isCurrent &&
          "ring-4 ring-duo-yellow ring-offset-2 ring-offset-duo-bg scale-[1.02]",
      )}
    >
      {/* 학습 단어 — 큼·굵음. 후리가나 있으면 line-height 넉넉히. */}
      <h3
        lang={card.lang}
        className={cn(
          "text-2xl text-duo-text wrap-break-word",
          hasFurigana ? "leading-[1.85]" : "leading-snug",
        )}
        style={{ fontWeight: 800, letterSpacing: "normal" }}
      >
        <Furigana text={card.targetText} parts={card.furigana ?? null} />
      </h3>

      {/* 뜻 — 적당히 흐림 */}
      <p
        lang={meaningLang}
        className="mt-1 text-base font-semibold text-duo-text-muted leading-snug wrap-break-word"
      >
        {card.meaning}
      </p>

      {/* 푸터 — 시간 + 댓글 (있으면) */}
      <div className="mt-2 flex items-center justify-end gap-2 text-xs text-duo-text-muted/80">
        {card.commentCount > 0 && (
          <span className="flex items-center gap-1 font-bold">
            <MessageCircle
              className="h-3.5 w-3.5"
              strokeWidth={2.5}
              aria-hidden
            />
            <span>{card.commentCount}</span>
          </span>
        )}
        <RelativeTime ts={card.createdAt} />
      </div>

      {/* 확인됨 ✓ 배지 — 카드 코너 (mine: 우상단, theirs: 좌상단) */}
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

      {/* 말풍선 꼬리 — 사이드 (mine: 우측, theirs: 좌측) */}
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

