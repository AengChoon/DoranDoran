"use client";
import * as React from "react";
import { useCommentsForCard } from "@/lib/api/cards";
import { useT } from "@/lib/i18n";
import { CommentItem } from "./CommentItem";
import { CommentComposer } from "./CommentComposer";

type Props = {
  cardId: string;
  meId: string | undefined;
};

/**
 * 카드 상세 하단 — 댓글 목록(시간순 ↑) + 작성 입력창.
 *
 * 카드와 동일한 좌우 정렬 (본인=우, 상대=좌). 빈 상태에선 placeholder 한 줄.
 */
export function CommentSection({ cardId, meId }: Props) {
  const t = useT();
  const comments = useCommentsForCard(cardId);

  return (
    <section className="mt-8 pt-6 border-t-2 border-duo-border">
      <h2 className="text-base font-extrabold text-duo-text mb-4">
        {t.comments.title}
        {comments.length > 0 && (
          <span className="ml-1.5 text-duo-text-muted/70 tabular-nums">
            {comments.length}
          </span>
        )}
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm text-duo-text-muted/70 text-center py-6">
          {t.comments.empty}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {comments.map((c) => (
            <li key={c.id}>
              <CommentItem comment={c} isMine={!!meId && c.authorId === meId} />
            </li>
          ))}
        </ul>
      )}

      <div className="mt-5">
        <CommentComposer cardId={cardId} />
      </div>
    </section>
  );
}
