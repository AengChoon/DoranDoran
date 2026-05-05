"use client";
import * as React from "react";
import { commentCreateSchema } from "@dorandoran/shared";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { useCreateComment } from "@/lib/api/comments";
import { useT } from "@/lib/i18n";

type Props = {
  cardId: string;
};

/**
 * 댓글 작성 입력창.
 *
 * - Textarea + 보내기 버튼 (block, 아래)
 * - body 비었거나 mutation 진행 중엔 비활성
 * - desktop: Cmd/Ctrl+Enter로 즉시 전송. Enter는 줄바꿈 (모바일 호환).
 */
export function CommentComposer({ cardId }: Props) {
  const t = useT();
  const create = useCreateComment(cardId);
  const [body, setBody] = React.useState("");
  const taRef = React.useRef<HTMLTextAreaElement>(null);

  // 입력에 따라 textarea height 자동 조정 — min 60px, max 160px (그 이상은 내부 스크롤)
  React.useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
  }, [body]);

  const trimmed = body.trim();
  const valid = commentCreateSchema.safeParse({ body: trimmed }).success;
  const disabled = !valid || create.isPending;

  async function send() {
    if (disabled) return;
    try {
      await create.mutateAsync({ body: trimmed });
      setBody("");
    } catch {
      // 실패 시 입력 유지 — 사용자가 재시도 가능
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    void send();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    // Cmd/Ctrl + Enter — 즉시 전송 (Enter 단독은 줄바꿈 그대로)
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2">
      <Textarea
        ref={taRef}
        value={body}
        onChange={(e) => setBody(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={t.comments.placeholder}
        maxLength={2000}
        className="min-h-[60px]"
        rows={2}
      />
      <Button type="submit" size="block" disabled={disabled}>
        {create.isPending ? t.comments.sending : t.comments.send}
      </Button>
    </form>
  );
}
