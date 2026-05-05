"use client";
import * as React from "react";
import { Pencil, Trash2 } from "lucide-react";
import type { CardWithMeta, UserPublic } from "@dorandoran/shared";
import { Button } from "@/components/ui/Button";
import { CardCarousel } from "@/components/card/CardCarousel";
import { CardForm } from "@/components/card/CardForm";
import { CardView } from "@/components/card/CardView";
import { CorrectionForm } from "@/components/card/CorrectionForm";
import {
  useDeleteCard,
  useUnconfirmCard,
} from "@/lib/api/cards";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type Props = {
  card: CardWithMeta;
  me: Pick<UserPublic, "id"> | null | undefined;
  /** 삭제 후 콜백 (페이지: /feed로 push, 모달: close) */
  onAfterDelete: () => void;
  /** 편집 저장 후 redirect 경로 */
  editRedirectTo: string;
};

/**
 * 카드 상세 — 모달 안 본문.
 *
 * 모드 분기:
 *  - editing: 본인이 카드 본문 수정 (CardForm)
 *  - correcting: 상대가 첨삭 모드 (CorrectionForm)
 *  - 보기:
 *    - 첨삭본 있음 → CardCarousel (첨삭본 ↔ 원본)
 *    - 그 외 → 단일 CardView
 */
export function CardDetail({
  card,
  me,
  onAfterDelete,
  editRedirectTo,
}: Props) {
  const t = useT();
  const unconfirm = useUnconfirmCard();
  const del = useDeleteCard();

  const [editing, setEditing] = React.useState(false);
  const [correcting, setCorrecting] = React.useState(false);

  const isMine = me?.id === card.authorId;
  const isConfirmed = card.confirmedAt !== null;
  const hasCorrection =
    card.correction != null &&
    (card.correction.target ||
      card.correction.meaning ||
      card.correction.example ||
      card.correction.note);

  // ── 본인 카드 수정 모드
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

  // ── 상대방 첨삭 모드
  if (correcting) {
    return (
      <CorrectionForm
        card={card}
        onDone={() => setCorrecting(false)}
        onCancel={() => setCorrecting(false)}
      />
    );
  }

  async function onDelete() {
    if (!window.confirm(t.card.deleteConfirm)) return;
    await del.mutateAsync(card.id);
    onAfterDelete();
  }

  async function onUndoCorrect() {
    if (!window.confirm(t.card.correctUndoConfirm)) return;
    try {
      await unconfirm.mutateAsync(card.id);
    } catch {
      // 무시 — 다음 sync로 복원
    }
  }

  // article footer 우측에 들어갈 본인용 액션 (수정/삭제)
  const ownerControls = isMine ? (
    <div className="flex items-center gap-0.5 -mr-1.5">
      <IconBtn label={t.card.fieldEdit} onClick={() => setEditing(true)}>
        <Pencil className="h-4 w-4" strokeWidth={2.5} />
      </IconBtn>
      <IconBtn
        label={t.card.deleteConfirm}
        onClick={onDelete}
        disabled={del.isPending}
        tone="danger"
      >
        <Trash2 className="h-4 w-4" strokeWidth={2.5} />
      </IconBtn>
    </div>
  ) : null;

  return (
    <>
      {hasCorrection ? (
        <CardCarousel card={card} trailing={ownerControls} />
      ) : (
        <CardView card={card} mode="original" trailing={ownerControls} />
      )}

      {/* 상대 카드일 때 액션 — 상태에 따라 다름 */}
      {!isMine && me && (
        <div className="mt-6 flex flex-col gap-2">
          {!isConfirmed && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => setCorrecting(true)}
              className="w-full"
            >
              {t.card.correct}
            </Button>
          )}
          {isConfirmed && card.confirmedBy === me.id && (
            <>
              <Button
                variant="secondary"
                size="md"
                onClick={() => setCorrecting(true)}
                className="w-full"
              >
                {t.card.correctEdit}
              </Button>
              <Button
                variant="ghost"
                size="md"
                onClick={onUndoCorrect}
                disabled={unconfirm.isPending}
                className="w-full"
              >
                {t.card.correctUndo}
              </Button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  tone = "default",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
        disabled
          ? "text-duo-text-muted/40 cursor-not-allowed"
          : tone === "danger"
            ? "text-duo-text-muted hover:text-duo-red hover:bg-duo-red/5"
            : "text-duo-text-muted hover:text-duo-text hover:bg-duo-bg-muted",
      )}
    >
      {children}
    </button>
  );
}
