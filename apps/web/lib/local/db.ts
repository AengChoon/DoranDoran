import Dexie, { type Table } from "dexie";
import type { Card, UserPublic } from "@dorandoran/shared";

/**
 * 로컬 IndexedDB — 도란도란 클라이언트 데이터 스토어.
 *
 * 서버와 델타 sync로 동기화. UI는 항상 이 로컬 DB만 읽음.
 *
 * 인덱스 설계:
 *  - cards: id(PK) / authorId / lang / confirmedAt / createdAt / updatedAt / deletedAt
 *      - [authorId+createdAt] 복합 인덱스로 "내 카드 시간순" 빠르게
 *  - users: id(PK) / email / updatedAt
 *  - meta: key(PK) — lastSyncAt 같은 단일 값 저장용
 *
 * v2: comments 테이블 제거 (첨삭은 Card.correction에 JSON으로 들어감).
 */

export type LocalCard = Card;
export type LocalUser = UserPublic;

export type MetaEntry = {
  key: string;
  value: unknown;
};

class DoranDB extends Dexie {
  cards!: Table<LocalCard, string>;
  users!: Table<LocalUser, string>;
  meta!: Table<MetaEntry, string>;

  constructor() {
    super("dorandoran");
    // v1 — comments 포함된 옛 스키마
    this.version(1).stores({
      cards:
        "id, authorId, lang, confirmedAt, createdAt, updatedAt, deletedAt, [authorId+createdAt]",
      comments: "id, cardId, authorId, createdAt, updatedAt, deletedAt",
      users: "id, email, updatedAt",
      meta: "key",
    });
    // v2 — comments 테이블 제거. 옛 클라엔서 자동 마이그레이션 (테이블 그냥 사라짐).
    this.version(2).stores({
      cards:
        "id, authorId, lang, confirmedAt, createdAt, updatedAt, deletedAt, [authorId+createdAt]",
      comments: null,
      users: "id, email, updatedAt",
      meta: "key",
    });
  }
}

let _db: DoranDB | null = null;

export function getLocalDb(): DoranDB {
  if (typeof window === "undefined") {
    // SSR — IndexedDB 없음. 호출자가 client only인지 확인해야 함.
    throw new Error("getLocalDb() called on server");
  }
  if (!_db) _db = new DoranDB();
  return _db;
}

// ─── meta helpers ────────────────────────────────────
const LAST_SYNC_KEY = "lastSyncAt";

export async function getLastSyncAt(): Promise<number> {
  const row = await getLocalDb().meta.get(LAST_SYNC_KEY);
  return typeof row?.value === "number" ? row.value : 0;
}

export async function setLastSyncAt(value: number): Promise<void> {
  await getLocalDb().meta.put({ key: LAST_SYNC_KEY, value });
}

/** 로그아웃 시 호출 — 모든 로컬 데이터 비움 */
export async function clearLocalDb(): Promise<void> {
  const db = getLocalDb();
  await db.transaction("rw", db.cards, db.users, db.meta, async () => {
    await db.cards.clear();
    await db.users.clear();
    await db.meta.clear();
  });
}
