export const APP_NAME = "도란도란" as const;
export const APP_NAME_JA = "ドランドラン" as const;
export const APP_NAME_EN = "dorandoran" as const;
export const APP_TAGLINE_KO = "둘이서 도란도란" as const;
export const APP_TAGLINE_JA = "ふたりでドランドラン" as const;

export const LANGS = ["ko", "ja"] as const;
export type Lang = (typeof LANGS)[number];

export const REVIEW_QUALITY = {
  AGAIN: 1,
  HARD: 2,
  GOOD: 3,
  EASY: 5,
} as const;
export type ReviewQuality =
  (typeof REVIEW_QUALITY)[keyof typeof REVIEW_QUALITY];

export const MAX_AUDIO_SECONDS = 30;
