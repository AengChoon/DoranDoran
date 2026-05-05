"use client";
import * as React from "react";
import { Pencil, Check as CheckIcon, Trash2 } from "lucide-react";
import type { CardWithMeta, UserPublic } from "@dorandoran/shared";
import { Button } from "@/components/ui/Button";
import { CardForm } from "@/components/card/CardForm";
import { CommentSection } from "@/components/card/CommentSection";
import { Furigana } from "@/components/card/Furigana";
import { RelativeTime } from "@/components/ui/RelativeTime";
import {
  useConfirmCard,
  useDeleteCard,
  useUnconfirmCard,
} from "@/lib/api/cards";
import { cn } from "@/lib/cn";

type Props = {
  card: CardWithMeta;
  me: Pick<UserPublic, "id"> | null | undefined;
  /** 삭제 후 콜백 (페이지: /feed로 push, 모달: close) */
  onAfterDelete: () => void;
  /** 편집 저장 후 redirect 경로 — 모달이면 같은 카드, 페이지면 같은 카드 상세 */
  editRedirectTo: string;
};

/**
 * 카드 상세 뷰 — CardDetailModal에서 사용.
 *
 * 자체 편집 모드 토글 (수정 버튼 → CardForm).
 * 확인/취소·삭제·수정 액션 포함. 닫기 등 외곽 navigation은 호출자 담당.
 */
export function CardDetail({
  card,
  me,
  onAfterDelete,
  editRedirectTo,
}: Props) {
  const confirm = useConfirmCard();
  const unconfirm = useUnconfirmCard();
  const del = useDeleteCard();

  const [editing, setEditing] = React.useState(false);

  const isMine = me?.id === card.authorId;
  const isConfirmed = card.confirmedAt !== null;
  const meaningLang = card.lang === "ko" ? "ja" : "ko";

  if (editing) {
    return (
      <div>
        <h2 className="text-2xl font-extrabold text-duo-text mb-6">
          카드 수정
        </h2>
        <CardForm
          mode={{
            kind: "edit",
            cardId: card.id,
            initial: {
              lang: card.lang,
              targetText: card.targetText,
              meaning: card.meaning,
              example: card.example,
              note: card.note,
              furigana: card.furigana,
            },
          }}
          redirectTo={editRedirectTo}
          onCancel={() => setEditing(false)}
          onSuccess={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <>
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
          className="text-3xl text-duo-text leading-[1.85] wrap-break-word"
          style={{ fontWeight: 800, letterSpacing: "normal" }}
        >
          <Furigana text={card.targetText} parts={card.furigana ?? null} />
        </h1>
        <p
          lang={meaningLang}
          className="mt-2 text-lg font-semibold text-duo-text-muted leading-snug wrap-break-word"
        >
          {card.meaning}
        </p>

        {card.example && (
          <Section label="예문">
            <p
              lang={card.lang}
              className="text-sm leading-relaxed text-duo-text-muted wrap-break-word"
            >
              {card.example}
            </p>
          </Section>
        )}
        {card.note && (
          <Section label="메모">
            <p className="text-sm leading-relaxed text-duo-text-muted wrap-break-word whitespace-pre-wrap">
              {card.note}
            </p>
          </Section>
        )}

        <div className="mt-5 pt-3 border-t border-duo-border flex items-center justify-between text-xs text-duo-text-muted">
          <span>{isMine ? "내 카드" : "파트너의 카드"}</span>
          <RelativeTime ts={card.createdAt} />
        </div>
      </article>

      <div className="mt-6 flex flex-col gap-2">
        {isMine && (
          <>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => setEditing(true)}
              className="w-full"
            >
              <Pencil className="h-4 w-4 mr-2" />
              수정
            </Button>
            <Button
              variant="ghost"
              size="md"
              onClick={async () => {
                if (!window.confirm("이 카드를 삭제할까요?")) return;
                await del.mutateAsync(card.id);
                onAfterDelete();
              }}
              disabled={del.isPending}
              className="w-full"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              삭제
            </Button>
          </>
        )}

        {!isMine && me && (
          <>
            {isConfirmed ? (
              <Button
                variant="ghost"
                size="lg"
                onClick={() => unconfirm.mutate(card.id)}
                disabled={unconfirm.isPending}
                className="w-full"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                확인 취소
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                onClick={() => confirm.mutate(card.id)}
                disabled={confirm.isPending}
                className="w-full"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                확인하기
              </Button>
            )}
          </>
        )}
      </div>

      <CommentSection cardId={card.id} meId={me?.id} />
    </>
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
