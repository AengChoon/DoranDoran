import type { Lang } from "./constants";

/**
 * 동기 가능한 모든 엔티티의 공통 타임스탬프.
 * deletedAt이 있으면 톰스톤(소프트 삭제) — 클라이언트는 로컬에서 제거.
 */
export type Syncable = {
  createdAt: number;
  updatedAt: number;
  deletedAt: number | null;
};

export type UserPublic = {
  id: string;
  email: string;
  displayName: string;
  nativeLang: Lang;
  learningLang: Lang;
  avatarUrl: string | null;
} & Syncable;

/**
 * 후리가나 한 조각.
 *  - 한자(또는 한자 그룹)에 카나 매칭: { base: "月", ruby: "げつ" }
 *  - 숙자훈(그룹 루비): { base: "今日", ruby: "きょう" }
 *  - 카나·조사 등: { base: "は", ruby: null }
 */
export type FuriganaPart = {
  base: string;
  ruby: string | null;
};

export type Card = {
  id: string;
  authorId: string;
  lang: Lang;
  targetText: string;
  meaning: string;
  example: string | null;
  note: string | null;
  audioUrl: string | null;
  tags: string[];
  /** 한자별 후리가나 매핑 (일본어 카드만) */
  furigana: FuriganaPart[] | null;
  /** 원어민 확인 시각 — null이면 대기 상태 */
  confirmedAt: number | null;
  /** 누가 확인했는지 (원어민 user id) */
  confirmedBy: string | null;
} & Syncable;

export type Comment = {
  id: string;
  cardId: string;
  authorId: string;
  body: string;
  audioUrl: string | null;
} & Syncable;

export type ReviewState = {
  cardId: string;
  userId: string;
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
  nextReviewAt: number;
  lastReviewedAt: number | null;
} & Syncable;

export type CardWithMeta = Card & {
  commentCount: number;
};

export type CardListResponse = {
  items: CardWithMeta[];
  nextCursor: string | null;
};

export type MeResponse = {
  user: UserPublic;
  partner: UserPublic | null;
};

/**
 * 델타 sync 응답.
 * 클라이언트는 since=lastSyncAt 으로 호출.
 * 서버는 updatedAt > since 인 모든 엔티티 반환 (deletedAt 포함).
 * 클라이언트 로직:
 *   - deletedAt 있음 → 로컬에서 제거
 *   - deletedAt 없음 → 로컬에 upsert
 *   - 다음 sync 호출 시 lastSyncAt = serverTime 사용
 */
export type SyncResponse = {
  cards: Card[];
  comments: Comment[];
  users: UserPublic[];
  serverTime: number;
};
