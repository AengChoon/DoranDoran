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
  onboardedAt: number | null;
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

/**
 * 한 필드의 첨삭 — 본문 수정과 코멘트 둘 다 옵션.
 * `text`만 있으면 텍스트만 고침. `comment`만 있으면 텍스트 그대로 + 설명만.
 * 둘 다 비면 그 필드의 키 자체가 없어야 함.
 */
export type CorrectionField = {
  text?: string;
  comment?: string;
  /** target 필드 한정 — 일본어 첨삭 시 후리가나도 다시 매핑 */
  furigana?: FuriganaPart[] | null;
};

/** 카드 첨삭본 — 4개 필드 각각 optional. 빈 객체는 "checked, no edits"와 동일. */
export type Correction = {
  target?: CorrectionField;
  meaning?: CorrectionField;
  example?: CorrectionField;
  note?: CorrectionField;
};

export type Card = {
  id: string;
  authorId: string;
  lang: Lang;
  targetText: string;
  meaning: string;
  example: string | null;
  note: string | null;
  tags: string[];
  /** 한자별 후리가나 매핑 (일본어 카드만) */
  furigana: FuriganaPart[] | null;
  /** 원어민 확인 시각 — null이면 대기. confirmed면 ✓ (correction 유무 무관). */
  confirmedAt: number | null;
  /** 누가 확인했는지 (원어민 user id) */
  confirmedBy: string | null;
  /** 첨삭본 — confirmed_at 있어도 비어있을 수 있음 (= 그대로 OK). */
  correction: Correction | null;
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

export type CardWithMeta = Card;

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
  users: UserPublic[];
  serverTime: number;
};
