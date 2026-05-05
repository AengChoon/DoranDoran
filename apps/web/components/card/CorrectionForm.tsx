"use client";
import * as React from "react";
import type { CardWithMeta, Correction } from "@dorandoran/shared";
import { Button } from "@/components/ui/Button";
import { Textarea, Input } from "@/components/ui/Input";
import { useConfirmCard } from "@/lib/api/cards";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/cn";

type FieldKey = "target" | "meaning" | "example" | "note";

type FieldDraft = {
  text: string; // 첨삭본 텍스트 — 원본과 같으면 무시됨
  comment: string; // 한 줄 코멘트
};

type DraftMap = Record<FieldKey, FieldDraft>;

type Props = {
  card: CardWithMeta;
  onDone: () => void;
  onCancel: () => void;
};

/**
 * 첨삭 작성 폼.
 *
 * 각 필드(원본 있는 필드만)가 한 줄씩 보임. 위에 원본 텍스트(연한 회색),
 * 아래에 첨삭본 Textarea + 코멘트 Input.
 *
 * 첨삭본이 원본과 같고 코멘트도 비면 그 필드는 saving 시 빠짐.
 * 모든 필드가 그렇다면 "그대로 OK" 상태로 confirm만 됨.
 */
export function CorrectionForm({ card, onDone, onCancel }: Props) {
  const t = useT();
  const confirm = useConfirmCard();

  // 초기 draft = 기존 correction이 있으면 그걸 prefill, 없으면 원본 그대로
  const [draft, setDraft] = React.useState<DraftMap>(() => initDraft(card));
  const [error, setError] = React.useState<string | null>(null);

  function update(key: FieldKey, partial: Partial<FieldDraft>) {
    setDraft((d) => ({ ...d, [key]: { ...d[key], ...partial } }));
  }

  function revert(key: FieldKey) {
    setDraft((d) => ({
      ...d,
      [key]: { text: originalOf(card, key), comment: "" },
    }));
  }

  async function handleSubmit() {
    setError(null);
    const correction = buildCorrection(card, draft);
    try {
      await confirm.mutateAsync({ id: card.id, correction });
      onDone();
    } catch {
      setError("저장 중 문제가 생겼어요");
    }
  }

  // 원본이 비어있는 필드(example, note가 null)는 폼에서 숨김.
  // 학습자가 아직 적지 않은 필드를 첨삭자가 일부러 채우는 건 벗어난 시나리오.
  const fields: { key: FieldKey; label: string }[] = [
    { key: "target", label: t.card.fieldTarget },
    { key: "meaning", label: t.card.fieldMeaning },
    ...(card.example
      ? ([{ key: "example", label: t.card.fieldExample }] as const)
      : []),
    ...(card.note
      ? ([{ key: "note", label: t.card.fieldNote }] as const)
      : []),
  ];

  return (
    <div className="flex flex-col gap-4">
      {fields.map(({ key, label }) => (
        <FieldRow
          key={key}
          label={label}
          original={originalOf(card, key)}
          draft={draft[key]}
          isTarget={key === "target"}
          lang={card.lang}
          meaningLang={card.lang === "ko" ? "ja" : "ko"}
          onTextChange={(text) => update(key, { text })}
          onCommentChange={(comment) => update(key, { comment })}
          onRevert={() => revert(key)}
        />
      ))}

      {error && (
        <p className="text-duo-red font-bold text-sm px-1" role="alert">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <Button
          type="button"
          size="block"
          onClick={handleSubmit}
          disabled={confirm.isPending}
        >
          {confirm.isPending ? t.card.correctSaving : t.card.correctDone}
        </Button>
        <Button type="button" variant="ghost" size="md" onClick={onCancel}>
          {t.card.cancelCorrect}
        </Button>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  original,
  draft,
  isTarget,
  lang,
  meaningLang,
  onTextChange,
  onCommentChange,
  onRevert,
}: {
  label: string;
  original: string;
  draft: FieldDraft;
  isTarget: boolean;
  lang: "ko" | "ja";
  meaningLang: "ko" | "ja";
  onTextChange: (v: string) => void;
  onCommentChange: (v: string) => void;
  onRevert: () => void;
}) {
  const t = useT();
  const changed = draft.text.trim() !== original.trim();
  // target/example은 학습 언어, meaning은 반대, note는 자유 — note는 lang 안 줌
  const inputLang =
    label === t.card.fieldMeaning
      ? meaningLang
      : label === t.card.fieldNote
        ? undefined
        : lang;

  return (
    <div
      className={cn(
        "rounded-duo border-2 px-3 py-3 transition-colors",
        changed
          ? "border-duo-green/60 bg-duo-green/5"
          : "border-duo-border bg-white",
      )}
    >
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-duo-text-muted/70">
          {label}
        </label>
        {changed && (
          <button
            type="button"
            onClick={onRevert}
            className="text-[11px] font-bold text-duo-blue hover:underline"
          >
            {t.card.fieldRevert}
          </button>
        )}
      </div>

      <p className="text-xs text-duo-text-muted/70 mb-2 wrap-break-word whitespace-pre-wrap">
        {original}
      </p>

      <Textarea
        lang={inputLang}
        value={draft.text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder={t.card.fieldEditPlaceholder}
        rows={isTarget ? 1 : 2}
        className="min-h-[44px] text-base"
      />

      <Input
        lang={inputLang}
        value={draft.comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder={t.card.fieldCommentPlaceholder}
        maxLength={500}
        className="mt-2 h-11 text-sm"
      />
    </div>
  );
}

function originalOf(card: CardWithMeta, key: FieldKey): string {
  switch (key) {
    case "target":
      return card.targetText;
    case "meaning":
      return card.meaning;
    case "example":
      return card.example ?? "";
    case "note":
      return card.note ?? "";
  }
}

function initDraft(card: CardWithMeta): DraftMap {
  const c = card.correction;
  function fromField(key: FieldKey): FieldDraft {
    const orig = originalOf(card, key);
    const f = c?.[key];
    return {
      text: f?.text ?? orig,
      comment: f?.comment ?? "",
    };
  }
  return {
    target: fromField("target"),
    meaning: fromField("meaning"),
    example: fromField("example"),
    note: fromField("note"),
  };
}

/**
 * draft를 Correction 객체로. 변경 없는 필드는 빠짐.
 *  - text가 원본과 같고 comment가 비어있으면 → 그 필드 키 자체가 없음
 *  - text만 변경 → { text }
 *  - comment만 추가 → { comment }
 *  - 둘 다 → { text, comment }
 */
function buildCorrection(card: CardWithMeta, draft: DraftMap): Correction {
  const result: Correction = {};
  (["target", "meaning", "example", "note"] as const).forEach((key) => {
    const orig = originalOf(card, key).trim();
    const dText = draft[key].text.trim();
    const dComment = draft[key].comment.trim();
    const textChanged = dText !== orig && dText.length > 0;
    const hasComment = dComment.length > 0;
    if (!textChanged && !hasComment) return;
    const field: { text?: string; comment?: string } = {};
    if (textChanged) field.text = dText;
    if (hasComment) field.comment = dComment;
    result[key] = field;
  });
  return result;
}
