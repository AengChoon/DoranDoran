"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import {
  detectLang,
  type FuriganaPart,
  type Lang,
} from "@dorandoran/shared";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { useCreateCard, useUpdateCard } from "@/lib/api/cards";
import { useMe } from "@/lib/api/me";
import {
  buildFurigana,
  getKanjiPositions,
  hasKanji,
  unbuildFurigana,
} from "@/lib/furigana";

type Mode =
  | { kind: "create" }
  | { kind: "edit"; cardId: string; initial: CardEditableValues };

type Props = {
  mode: Mode;
  redirectTo?: string;
  onCancel?: () => void;
  /** 저장 성공 후 호출 — 모달 등 컨텍스트에서 편집 모드 종료용 */
  onSuccess?: () => void;
};

export type CardEditableValues = {
  lang: Lang;
  targetText: string;
  meaning: string;
  example: string | null;
  note: string | null;
  furigana: FuriganaPart[] | null;
};

/**
 * 카드 작성/편집 폼.
 * - 공통 필드: targetText, meaning, example, note
 * - 일본어 전용: 후리가나 (한자별 입력)
 * - 한국어 전용: 현재 없음, 추후 LangExtras에서 분기 추가
 */
export function CardForm({
  mode,
  redirectTo = "/feed",
  onCancel,
  onSuccess,
}: Props) {
  const router = useRouter();
  const meQuery = useMe();
  const create = useCreateCard();
  const update = useUpdateCard();

  const initial =
    mode.kind === "edit"
      ? mode.initial
      : ({
          lang: "ja" as Lang,
          targetText: "",
          meaning: "",
          example: null,
          note: null,
          furigana: null,
        } satisfies CardEditableValues);

  const [targetText, setTargetText] = React.useState(initial.targetText);
  const [meaning, setMeaning] = React.useState(initial.meaning);
  const [example, setExample] = React.useState(initial.example ?? "");
  const [note, setNote] = React.useState(initial.note ?? "");
  // 한자 char index → reading 매핑
  const [readingMap, setReadingMap] = React.useState<Record<number, string>>(
    () => unbuildFurigana(initial.targetText, initial.furigana),
  );
  const [showExtras, setShowExtras] = React.useState(
    Boolean(
      initial.example ||
        initial.note ||
        (initial.furigana && initial.furigana.length > 0),
    ),
  );
  const [error, setError] = React.useState<string | null>(null);

  const detectedLang = React.useMemo<Lang | null>(
    () => detectLang(targetText.trim()),
    [targetText],
  );
  const effectiveLang: Lang = detectedLang ?? initial.lang;

  const learningLang = meQuery.data?.user.learningLang ?? null;
  const langMismatch =
    mode.kind === "create" &&
    detectedLang !== null &&
    learningLang !== null &&
    detectedLang !== learningLang;

  const isPending = create.isPending || update.isPending;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!targetText.trim() || !meaning.trim()) {
      setError("학습 단어와 뜻은 필수예요");
      return;
    }
    if (!detectedLang && mode.kind === "create") {
      setError("학습 단어의 언어를 감지하지 못했어요");
      return;
    }

    const trimmedTarget = targetText.trim();
    const furigana =
      effectiveLang === "ja" && hasKanji(trimmedTarget)
        ? buildFurigana(trimmedTarget, readingMap).filter(
            (p) => p.ruby !== null || /\S/.test(p.base),
          )
        : null;
    const hasAnyRuby = furigana?.some((p) => p.ruby !== null) ?? false;

    const payload = {
      lang: effectiveLang,
      targetText: trimmedTarget,
      meaning: meaning.trim(),
      example: example.trim() || undefined,
      note: note.trim() || undefined,
      furigana: hasAnyRuby ? furigana : undefined,
    };

    try {
      if (mode.kind === "create") {
        await create.mutateAsync(payload);
      } else {
        await update.mutateAsync({ id: mode.cardId, ...payload });
      }
      onSuccess?.();
      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("저장 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      {/* 학습 단어 */}
      <div>
        <label
          htmlFor="targetText"
          className="block text-sm font-extrabold text-duo-text mb-1.5"
        >
          학습 단어
        </label>
        <Textarea
          id="targetText"
          lang={detectedLang ?? undefined}
          value={targetText}
          onChange={(e) => setTargetText(e.target.value)}
          placeholder={mode.kind === "create" ? "勉強" : ""}
          className="min-h-[88px] text-xl"
          autoFocus={mode.kind === "create"}
          required
        />
        <div className="mt-1.5 flex items-center justify-between gap-2 text-xs">
          <span className="text-duo-text-muted">
            {detectedLang === "ko" && "한국어로 감지됨"}
            {detectedLang === "ja" && "일본어로 감지됨"}
            {detectedLang === null && "내용을 입력하면 언어가 자동 감지돼요"}
          </span>
          {langMismatch && (
            <span className="font-bold text-duo-yellow-dark text-right">
              본인 학습 언어({langLabel(learningLang!)})와 달라요
            </span>
          )}
        </div>
      </div>

      {/* 뜻 */}
      <div>
        <label
          htmlFor="meaning"
          className="block text-sm font-extrabold text-duo-text mb-1.5"
        >
          뜻
        </label>
        <Input
          id="meaning"
          value={meaning}
          onChange={(e) => setMeaning(e.target.value)}
          placeholder={mode.kind === "create" ? "공부" : ""}
          required
        />
      </div>

      {/* 추가 입력 펼치기 */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setShowExtras((v) => !v)}
        className="gap-1.5"
      >
        {showExtras ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        {showExtras ? "추가 입력 닫기" : "후리가나·예문·메모 추가"}
      </Button>

      {showExtras && (
        <>
          <LangExtras
            lang={effectiveLang}
            targetText={targetText}
            readingMap={readingMap}
            onReadingMapChange={setReadingMap}
          />

          <div>
            <label
              htmlFor="example"
              className="block text-sm font-extrabold text-duo-text mb-1.5"
            >
              예문
            </label>
            <Textarea
              id="example"
              lang={detectedLang ?? undefined}
              value={example}
              onChange={(e) => setExample(e.target.value)}
              placeholder={
                mode.kind === "create" ? "今日は勉強する" : ""
              }
              className="min-h-[72px]"
            />
          </div>

          <div>
            <label
              htmlFor="note"
              className="block text-sm font-extrabold text-duo-text mb-1.5"
            >
              메모
            </label>
            <Textarea
              id="note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                mode.kind === "create" ? "캐주얼한 인사 — 친한 사이" : ""
              }
              className="min-h-[72px]"
            />
          </div>
        </>
      )}

      {error && (
        <p className="text-sm font-bold text-duo-red" role="alert">
          {error}
        </p>
      )}

      <div className="flex gap-2 mt-2">
        {onCancel && (
          <Button
            type="button"
            variant="ghost"
            size="lg"
            onClick={onCancel}
            className="flex-1"
          >
            취소
          </Button>
        )}
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className={onCancel ? "flex-2" : "w-full"}
        >
          {isPending ? "저장 중…" : mode.kind === "edit" ? "수정 저장" : "저장"}
        </Button>
      </div>
    </form>
  );
}

/**
 * 언어별 부가 입력 — 분기 지점.
 * 추후 한국어 전용 필드(예: 발음 가이드)는 여기서 ko 케이스 추가.
 */
function LangExtras({
  lang,
  targetText,
  readingMap,
  onReadingMapChange,
}: {
  lang: Lang;
  targetText: string;
  readingMap: Record<number, string>;
  onReadingMapChange: (m: Record<number, string>) => void;
}) {
  if (lang === "ja") {
    return (
      <JaFuriganaInputs
        targetText={targetText}
        readingMap={readingMap}
        onReadingMapChange={onReadingMapChange}
      />
    );
  }
  return null;
}

/**
 * 일본어 후리가나 입력 — targetText의 한자별로 인풋 한 줄씩.
 * 한자 없으면 섹션 자체 숨김.
 */
function JaFuriganaInputs({
  targetText,
  readingMap,
  onReadingMapChange,
}: {
  targetText: string;
  readingMap: Record<number, string>;
  onReadingMapChange: (m: Record<number, string>) => void;
}) {
  const positions = React.useMemo(
    () => getKanjiPositions(targetText),
    [targetText],
  );

  if (positions.length === 0) return null;

  return (
    <div>
      <div className="flex items-baseline justify-between mb-1.5">
        <label className="text-sm font-extrabold text-duo-text">
          후리가나{" "}
          <span className="font-semibold text-duo-text-muted">(옵션)</span>
        </label>
        <span className="text-xs text-duo-text-muted/70">
          숙자훈은 첫 칸에만 입력
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {positions.map(({ index, char }) => (
          <div key={index} className="flex items-center gap-2">
            <span
              lang="ja"
              className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-duo-sm border-2 border-duo-border bg-duo-bg-muted text-2xl font-extrabold text-duo-text"
            >
              {char}
            </span>
            <Input
              lang="ja"
              value={readingMap[index] ?? ""}
              onChange={(e) =>
                onReadingMapChange({
                  ...readingMap,
                  [index]: e.target.value,
                })
              }
              placeholder="읽기"
              className="flex-1 h-12"
            />
          </div>
        ))}
      </div>
      <p className="mt-2 text-xs text-duo-text-muted leading-relaxed">
        한자 위에 작은 카나로 표시됩니다. 비워두면 후리가나 없이 표시.
        <br />
        숙자훈(예: 今日 → きょう)은 첫 한자에만 입력하고 나머지는 비우세요.
      </p>
    </div>
  );
}

function langLabel(lang: Lang): string {
  return lang === "ko" ? "한국어" : "일본어";
}
