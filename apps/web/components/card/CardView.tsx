"use client";
import * as React from "react";
import type { CardWithMeta, FuriganaPart } from "@dorandoran/shared";
import { Furigana } from "@/components/card/Furigana";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { cn } from "@/lib/cn";

type Mode = "original" | "corrected";

type Props = {
  card: CardWithMeta;
  mode: Mode;
  /** article footer 우측에 끼울 컨트롤 (수정/삭제 아이콘 등) */
  trailing?: React.ReactNode;
};

/**
 * 카드 한 페이지 — 모달/상세에서 article 블록으로 사용.
 *
 * mode="original": 항상 원본만.
 * mode="corrected": 첨삭본 우선. 필드 첨삭 없으면 원본 fallback. 코멘트도 인라인 표시.
 *
 * 첨삭 텍스트가 있는 필드는 살짝 다른 톤 (연한 초록 백그라운드)으로 강조.
 */
export function CardView({ card, mode, trailing }: Props) {
  const isCorrected = mode === "corrected" && card.correction != null;
  const meaningLang = card.lang === "ko" ? "ja" : "ko";

  const target = isCorrected
    ? card.correction?.target?.text ?? card.targetText
    : card.targetText;
  const targetFurigana: FuriganaPart[] | null = isCorrected
    ? card.correction?.target?.furigana !== undefined
      ? (card.correction?.target?.furigana ?? null)
      : card.furigana
    : card.furigana;
  const targetComment = isCorrected ? card.correction?.target?.comment : null;
  const targetEdited = isCorrected && card.correction?.target?.text != null;

  const meaning = isCorrected
    ? card.correction?.meaning?.text ?? card.meaning
    : card.meaning;
  const meaningComment = isCorrected ? card.correction?.meaning?.comment : null;
  const meaningEdited = isCorrected && card.correction?.meaning?.text != null;

  const example = isCorrected
    ? card.correction?.example?.text ?? card.example
    : card.example;
  const exampleComment = isCorrected ? card.correction?.example?.comment : null;
  const exampleEdited = isCorrected && card.correction?.example?.text != null;

  const note = isCorrected
    ? card.correction?.note?.text ?? card.note
    : card.note;
  const noteComment = isCorrected ? card.correction?.note?.comment : null;
  const noteEdited = isCorrected && card.correction?.note?.text != null;

  const isConfirmed = card.confirmedAt !== null;

  return (
    <article
      className={cn(
        "rounded-duo-lg border-2 px-5 py-5 bg-white shadow-duo-card",
        isConfirmed
          ? "border-solid border-duo-border"
          : "border-dashed border-duo-border",
      )}
    >
      <h1
        lang={card.lang}
        className={cn(
          "text-3xl text-duo-text leading-[1.85] wrap-break-word px-1.5 -mx-1.5 rounded-md",
          targetEdited && "bg-duo-green/10",
        )}
        style={{ fontWeight: 800, letterSpacing: "normal" }}
      >
        <Furigana text={target} parts={targetFurigana} />
      </h1>
      {targetComment && <FieldComment>{targetComment}</FieldComment>}

      <p
        lang={meaningLang}
        className={cn(
          "mt-2 text-lg font-semibold text-duo-text-muted leading-snug wrap-break-word px-1.5 -mx-1.5 rounded-md",
          meaningEdited && "bg-duo-green/10 text-duo-text",
        )}
      >
        {meaning}
      </p>
      {meaningComment && <FieldComment>{meaningComment}</FieldComment>}

      {example && (
        <Section label="예문">
          <p
            lang={card.lang}
            className={cn(
              "text-sm leading-relaxed wrap-break-word px-1.5 -mx-1.5 rounded-md",
              exampleEdited
                ? "bg-duo-green/10 text-duo-text"
                : "text-duo-text-muted",
            )}
          >
            {example}
          </p>
          {exampleComment && <FieldComment>{exampleComment}</FieldComment>}
        </Section>
      )}
      {note && (
        <Section label="메모">
          <p
            className={cn(
              "text-sm leading-relaxed wrap-break-word whitespace-pre-wrap px-1.5 -mx-1.5 rounded-md",
              noteEdited
                ? "bg-duo-green/10 text-duo-text"
                : "text-duo-text-muted",
            )}
          >
            {note}
          </p>
          {noteComment && <FieldComment>{noteComment}</FieldComment>}
        </Section>
      )}

      <footer className="mt-5 pt-3 border-t border-duo-border flex items-center justify-between min-h-9">
        <RelativeTime
          ts={card.createdAt}
          className="text-xs text-duo-text-muted"
        />
        {trailing}
      </footer>
    </article>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-4 pt-3 border-t border-duo-border">
      <div className="text-[11px] font-extrabold tracking-wider text-duo-text-muted/70 uppercase mb-1">
        {label}
      </div>
      {children}
    </div>
  );
}

function FieldComment({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-1.5 text-xs italic text-duo-text-muted/80 leading-relaxed wrap-break-word">
      💬 {children}
    </p>
  );
}
