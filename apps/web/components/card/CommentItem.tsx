"use client";
import * as React from "react";
import { Trash2 } from "lucide-react";
import type { Comment } from "@dorandoran/shared";
import { RelativeTime } from "@/components/ui/RelativeTime";
import { useDeleteComment } from "@/lib/api/comments";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type Props = {
  comment: Comment;
  isMine: boolean;
};

/**
 * 댓글 한 개 — 카드 말풍선 톤 그대로 작은 사이즈로.
 * 본인: 우측 정렬, 연한 초록. 상대: 좌측 정렬, 흰색.
 * 본인 댓글에만 휴지통 버튼이 푸터에 노출됨.
 */
export function CommentItem({ comment, isMine }: Props) {
  const t = useT();
  const del = useDeleteComment(comment.cardId);

  async function onDelete() {
    if (!window.confirm(t.comments.deleteConfirm)) return;
    try {
      await del.mutateAsync(comment.id);
    } catch {
      // 삭제 실패는 무시 — 다음 sync에서 상태가 일관되게 맞춰짐
    }
  }

  return (
    <div
      className={cn(
        "relative rounded-duo border-2 border-solid px-3.5 py-2.5 max-w-[80%]",
        isMine
          ? "bg-[#F0FDE4] border-[#C8E6A8] ml-auto shadow-[0_3px_0_0_#C8E6A8]"
          : "bg-white border-duo-border mr-auto shadow-[0_3px_0_0_#E5E5E5]",
      )}
    >
      <p className="text-sm leading-snug text-duo-text whitespace-pre-wrap wrap-break-word">
        {comment.body}
      </p>

      <div className="mt-1.5 flex items-center justify-end gap-2 text-[11px] text-duo-text-muted/80">
        {isMine && (
          <button
            type="button"
            onClick={onDelete}
            disabled={del.isPending}
            aria-label={t.comments.deleteAria}
            className="text-duo-text-muted/60 hover:text-duo-red active:scale-95 transition-colors disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        )}
        <RelativeTime ts={comment.createdAt} />
      </div>

      {/* 말풍선 꼬리 — 카드와 동일 패턴 */}
      <span
        aria-hidden
        className={cn(
          "absolute h-2.5 w-2.5 rotate-45 border-2 border-solid",
          isMine
            ? "bg-[#F0FDE4] border-[#C8E6A8] right-[-6px] bottom-3 border-l-0 border-b-0"
            : "bg-white border-duo-border left-[-6px] bottom-3 border-t-0 border-r-0",
        )}
      />
    </div>
  );
}
