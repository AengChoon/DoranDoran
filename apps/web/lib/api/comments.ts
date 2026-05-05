import { useMutation } from "@tanstack/react-query";
import type { CommentCreate } from "@dorandoran/shared";
import { apiFetch } from "./client";
import { syncDelta } from "@/lib/local/sync";

/**
 * 댓글 mutation hooks.
 *
 * 읽기는 [lib/api/cards.ts]의 `useCommentsForCard`를 그대로 사용 (dexie live query).
 * 쓰기는 서버 호출 → 성공 시 syncDelta(force) → 로컬 dexie 갱신 → UI 자동 반응.
 */

export function useCreateComment(cardId: string) {
  return useMutation({
    mutationFn: async (input: CommentCreate) => {
      const res = await apiFetch<{ comment: { id: string } }>(
        `/cards/${cardId}/comments`,
        { method: "POST", body: JSON.stringify(input) },
      );
      await syncDelta({ force: true });
      return res;
    },
  });
}

export function useDeleteComment(cardId: string) {
  return useMutation({
    mutationFn: async (commentId: string) => {
      const res = await apiFetch<{ ok: true }>(
        `/cards/${cardId}/comments/${commentId}`,
        { method: "DELETE" },
      );
      await syncDelta({ force: true });
      return res;
    },
  });
}
