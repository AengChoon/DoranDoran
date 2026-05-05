import type { SyncResponse } from "@dorandoran/shared";
import { apiFetch } from "@/lib/api/client";
import {
  getLastSyncAt,
  getLocalDb,
  setLastSyncAt,
} from "./db";

/**
 * 델타 싱크 엔진.
 *
 * 동작:
 *  1. lastSyncAt 읽음 (없으면 0)
 *  2. GET /sync?since=lastSyncAt
 *  3. 응답을 Dexie에 트랜잭션으로 적용:
 *     - deletedAt 있는 row → 로컬에서 제거
 *     - 없는 row → upsert
 *  4. lastSyncAt = serverTime 저장
 *
 * 싱글 inflight 보장 — 동시에 여러 sync 호출되면 합침.
 * 실패 시 lastSyncAt 갱신 안 함 (다음 시도가 같은 since로 다시 받음).
 */

let _inflight: Promise<void> | null = null;
let _lastSyncAt = 0;
const MIN_INTERVAL_MS = 5000; // 자동 sync 최소 간격

/**
 * 델타 sync.
 *  - opts.force=false (기본): 마지막 sync 후 MIN_INTERVAL_MS 이내면 스킵
 *  - opts.force=true: 강제 즉시 sync (mutation 후 호출용)
 *
 * 쿠키는 httpOnly라 JS에서 못 봐서 항상 호출함.
 * 401이면 apiFetch가 /login으로 리다이렉트 (현재 위치가 /login 아닌 경우).
 * /login에선 그냥 silent fail.
 */
export async function syncDelta(opts?: { force?: boolean }): Promise<void> {
  if (_inflight) return _inflight;
  _inflight = run(opts?.force ?? false).finally(() => {
    _inflight = null;
  });
  return _inflight;
}

async function run(force: boolean) {
  const now = Date.now();
  if (!force && now - _lastSyncAt < MIN_INTERVAL_MS) return;
  _lastSyncAt = now;

  const since = await getLastSyncAt();
  const url = `/sync${since > 0 ? `?since=${since}` : ""}`;

  let resp: SyncResponse;
  try {
    resp = await apiFetch<SyncResponse>(url);
  } catch (err) {
    console.warn("[sync] fetch failed", err);
    return;
  }

  const db = getLocalDb();
  await db.transaction("rw", db.cards, db.users, db.meta, async () => {
    // cards
    for (const card of resp.cards) {
      if (card.deletedAt !== null) {
        await db.cards.delete(card.id);
      } else {
        await db.cards.put(card);
      }
    }
    // users
    for (const user of resp.users) {
      if (user.deletedAt !== null) {
        await db.users.delete(user.id);
      } else {
        await db.users.put(user);
      }
    }
    await setLastSyncAt(resp.serverTime);
  });

  if (resp.cards.length > 0 || resp.users.length > 0) {
    console.log(
      `[sync] applied ${resp.cards.length} cards, ${resp.users.length} users (since=${since})`,
    );
  }
}

/**
 * 탭 visibility 복귀 / 온라인 복귀 시 자동 sync.
 *
 * focus 이벤트는 DevTools 등으로 인해 너무 자주 발생함.
 * visibilitychange는 진짜 탭 전환/복귀에만 발생해서 더 적절.
 */
export function installAutoSync(): () => void {
  const onVisibility = () => {
    if (document.visibilityState === "visible") void syncDelta();
  };
  const onOnline = () => {
    void syncDelta({ force: true });
  };
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("online", onOnline);
  return () => {
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("online", onOnline);
  };
}
