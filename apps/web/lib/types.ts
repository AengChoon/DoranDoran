/**
 * Feed/카드용 프론트엔드 타입.
 * 추후 API 연결 시 @dorandoran/shared의 정식 Card 타입으로 갈아낄 것.
 */

export type Lang = "ko" | "ja";

export type FeedUser = {
  id: string;
  displayName: string;
  nativeLang: Lang;
  /** 아바타 배경색 (이니셜 표시용) */
  avatarColor: string;
};

/**
 * 후리가나 한 조각.
 * ruby가 null이면 단순 텍스트, 값 있으면 한자에 카나 위첨자.
 *
 * 예: 今日 → { base: "今日", ruby: "きょう" }
 *     は    → { base: "は", ruby: null }
 */
export type FuriganaPart = {
  base: string;
  ruby: string | null;
};

export type FeedCard = {
  id: string;
  authorId: string;
  lang: Lang;
  targetText: string;
  /** 한자별 카나 매핑. null/빈배열이면 후리가나 없음. */
  furigana?: FuriganaPart[] | null;
  meaning: string;
  example: string | null;
  note: string | null;
  createdAt: number;
  commentCount: number;
  /** 원어민 확인 시각. null이면 대기 상태. */
  confirmedAt: number | null;
  /** 누가 확인했는지 (원어민 user id) */
  confirmedBy: string | null;
};
