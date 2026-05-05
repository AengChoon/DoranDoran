import { useMutation } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useMemo } from "react";
import type {
  CardCreate,
  CardUpdate,
  CardWithMeta,
  Correction,
} from "@dorandoran/shared";
import { apiFetch } from "./client";
import { getLocalDb } from "@/lib/local/db";
import { syncDelta } from "@/lib/local/sync";

/**
 * 읽기는 전부 Dexie의 useLiveQuery 기반.
 * 로컬 DB가 sync로 업데이트되면 UI가 자동 반응.
 *
 * 쓰기는 fetch → 서버 → 성공 후 syncDelta()로 로컬 갱신.
 */

// ─── 읽기 (로컬 DB) ──────────────────────────────────

export function useCardsList(sinceTs?: number | null) {
  return useLiveQuery(
    async () => {
      const db = getLocalDb();
      const all =
        sinceTs == null
          ? await db.cards.orderBy("createdAt").reverse().toArray()
          : await db.cards
              .where("createdAt")
              .aboveOrEqual(sinceTs)
              .reverse()
              .toArray();
      // deletedAt은 sync에서 이미 제거됐지만 안전하게 한 번 더 필터
      return all.filter((c) => c.deletedAt === null) as CardWithMeta[];
    },
    [sinceTs ?? null],
    [] as CardWithMeta[],
  );
}

/** sinceTs 이전 (= createdAt < sinceTs)에 카드가 한 장이라도 있는지 — "이전 더 보기" CTA 노출용 */
export function useHasEarlierCards(sinceTs: number | null) {
  return useLiveQuery(
    async () => {
      if (sinceTs == null) return false;
      const db = getLocalDb();
      const n = await db.cards.where("createdAt").below(sinceTs).count();
      return n > 0;
    },
    [sinceTs],
    false,
  );
}

export function useCard(id: string | null | undefined) {
  return useLiveQuery(
    async () => {
      if (!id) return null;
      const db = getLocalDb();
      const card = await db.cards.get(id);
      if (!card || card.deletedAt !== null) return null;
      return card as CardWithMeta;
    },
    [id],
  );
}

// ─── 검색 (로컬 DB 기반 클라이언트 필터) ──────────────

type SearchableCard = Pick<
  CardWithMeta,
  "targetText" | "meaning" | "example" | "note" | "furigana" | "correction"
>;

/**
 * 카드 검색 매칭. corrected target이 있으면 그걸로, 없으면 원본 targetText.
 * 빈 query면 false.
 */
export function cardMatchesQuery(
  card: SearchableCard,
  query: string,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return false;
  const target = card.correction?.target?.text ?? card.targetText;
  return target.toLowerCase().includes(q);
}

/**
 * 검색 결과만 반환 (빈 쿼리면 전체).
 * 필터 모드 — 현재는 사용 안 하지만 보존 (향후 옵션).
 */
export function useSearchedCards(query: string) {
  const all = useCardsList();
  return useMemo(() => {
    if (!query.trim()) return all;
    return all.filter((c) => cardMatchesQuery(c, query));
  }, [all, query]);
}

// ─── 쓰기 (서버 → sync) ────────────────────────────

export function useCreateCard() {
  return useMutation({
    mutationFn: async (input: CardCreate) => {
      const res = await apiFetch<{ card: { id: string } }>("/cards", {
        method: "POST",
        body: JSON.stringify(input),
      });
      await syncDelta({ force: true });
      return res;
    },
  });
}

export function useUpdateCard() {
  return useMutation({
    mutationFn: async ({ id, ...input }: CardUpdate & { id: string }) => {
      const res = await apiFetch<{ ok: true }>(`/cards/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      await syncDelta({ force: true });
      return res;
    },
  });
}

export function useDeleteCard() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<{ ok: true }>(`/cards/${id}`, {
        method: "DELETE",
      });
      await syncDelta({ force: true });
      return res;
    },
  });
}

/**
 * 첨삭 완료 — 옵션으로 correction 같이 보냄.
 * correction이 비거나 없으면 "그대로 OK" (confirmed_at만 set).
 */
export function useConfirmCard() {
  return useMutation({
    mutationFn: async ({
      id,
      correction,
    }: {
      id: string;
      correction?: Correction;
    }) => {
      const res = await apiFetch<{ ok: true }>(`/cards/${id}/confirm`, {
        method: "POST",
        body: JSON.stringify({ correction }),
      });
      await syncDelta({ force: true });
      return res;
    },
  });
}

export function useUnconfirmCard() {
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiFetch<{ ok: true }>(`/cards/${id}/confirm`, {
        method: "DELETE",
      });
      await syncDelta({ force: true });
      return res;
    },
  });
}
