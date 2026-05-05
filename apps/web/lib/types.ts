/**
 * 프론트엔드 전용 타입. 카드/유저 정식 타입은 @dorandoran/shared에서 가져다 씀.
 */

export type Lang = "ko" | "ja";

export type FeedUser = {
  id: string;
  displayName: string;
  nativeLang: Lang;
  /** 업로드한 프로필 사진 URL — 있으면 이미지, 없으면 이니셜+avatarColor */
  avatarUrl: string | null;
  /** 아바타 배경색 (이니셜 표시용) */
  avatarColor: string;
};
