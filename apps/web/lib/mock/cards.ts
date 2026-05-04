import type { FeedCard, FeedUser } from "@/lib/types";

const HOUR = 1000 * 60 * 60;
const MIN = 1000 * 60;

export const mockUsers: { me: FeedUser; her: FeedUser } = {
  me: {
    id: "u1",
    displayName: "준",
    nativeLang: "ko",
    avatarColor: "#58CC02",
  },
  her: {
    id: "u2",
    displayName: "さくら",
    nativeLang: "ja",
    avatarColor: "#FF6B6B",
  },
};

const NOW = Date.now();

export const mockCards: FeedCard[] = [
  // 1시간 전 — 한국어 카드, 내가 확인함
  {
    id: "c1",
    authorId: "u2",
    lang: "ko",
    targetText: "안녕하세요",
    meaning: "こんにちは",
    example: "아침에 안녕하세요라고 인사해요",
    note: null,
    createdAt: NOW - HOUR * 1,
    commentCount: 0,
    confirmedAt: NOW - MIN * 30,
    confirmedBy: "u1",
  },
  // 2시간 전 — 일본어 카드, 상대가 확인함 (한자 X)
  {
    id: "c2",
    authorId: "u1",
    lang: "ja",
    targetText: "おはよう",
    meaning: "좋은 아침",
    example: "朝、おはようと言います",
    note: "캐주얼한 인사 — 친한 사이",
    createdAt: NOW - HOUR * 2,
    commentCount: 2,
    confirmedAt: NOW - HOUR * 1.5,
    confirmedBy: "u2",
  },
  // 25분 전 — 일본어 카드, 한자, 대기
  {
    id: "c3",
    authorId: "u1",
    lang: "ja",
    targetText: "猫",
    furigana: [{ base: "猫", ruby: "ねこ" }],
    meaning: "고양이",
    example: null,
    note: null,
    createdAt: NOW - MIN * 25,
    commentCount: 5,
    confirmedAt: null,
    confirmedBy: null,
  },
  // 8시간 전 — 한국어 카드, 확인됨
  {
    id: "c4",
    authorId: "u2",
    lang: "ko",
    targetText: "잘 자요",
    meaning: "おやすみなさい",
    example: "자기 전에 잘 자요라고 해요",
    note: null,
    createdAt: NOW - HOUR * 8,
    commentCount: 1,
    confirmedAt: NOW - HOUR * 7,
    confirmedBy: "u1",
  },
  // 18시간 전 — 일본어 긴 문장, 한자 다수, 대기
  {
    id: "c5",
    authorId: "u1",
    lang: "ja",
    targetText: "今日は天気がいいから散歩に行こう",
    furigana: [
      // 今日 → 숙자훈, 그룹 루비
      { base: "今日", ruby: "きょう" },
      { base: "は", ruby: null },
      // 天気 → 모노 루비 (한자 한 글자씩)
      { base: "天", ruby: "てん" },
      { base: "気", ruby: "き" },
      { base: "が", ruby: null },
      { base: "いいから", ruby: null },
      // 散歩 → 모노 루비 (歩는 연탁으로 ぽ)
      { base: "散", ruby: "さん" },
      { base: "歩", ruby: "ぽ" },
      { base: "に", ruby: null },
      // 行 → 단일 한자
      { base: "行", ruby: "い" },
      { base: "こう", ruby: null },
    ],
    meaning: "오늘은 날씨가 좋으니까 산책 가자",
    example: null,
    note: "「行こう」는 권유형",
    createdAt: NOW - HOUR * 18,
    commentCount: 3,
    confirmedAt: null,
    confirmedBy: null,
  },
  // 1일 전 — 일본어 짧음, 확인됨
  {
    id: "c6",
    authorId: "u1",
    lang: "ja",
    targetText: "ありがとう",
    meaning: "고마워",
    example: null,
    note: null,
    createdAt: NOW - HOUR * 24,
    commentCount: 3,
    confirmedAt: NOW - HOUR * 22,
    confirmedBy: "u2",
  },
  // 2일 전 — 한국어 짧음, 대기
  {
    id: "c7",
    authorId: "u2",
    lang: "ko",
    targetText: "맛있다",
    meaning: "おいしい",
    example: "이 김치찌개 진짜 맛있다",
    note: null,
    createdAt: NOW - HOUR * 24 * 2,
    commentCount: 0,
    confirmedAt: null,
    confirmedBy: null,
  },
  // 3일 전 — 한국어 긴 문장, 확인됨
  {
    id: "c8",
    authorId: "u2",
    lang: "ko",
    targetText: "비가 올 것 같아요",
    meaning: "雨が降りそうです",
    example: "하늘이 흐려서 비가 올 것 같아요",
    note: "「-(으)ㄹ 것 같다」는 추측 표현",
    createdAt: NOW - HOUR * 24 * 3,
    commentCount: 4,
    confirmedAt: NOW - HOUR * 24 * 2,
    confirmedBy: "u1",
  },
  // 4일 전 — 일본어 형용사 + 한자, 대기
  {
    id: "c9",
    authorId: "u1",
    lang: "ja",
    targetText: "可愛い",
    furigana: [
      { base: "可愛", ruby: "かわい" },
      { base: "い", ruby: null },
    ],
    meaning: "귀여워",
    example: "この犬、本当に可愛い",
    note: null,
    createdAt: NOW - HOUR * 24 * 4,
    commentCount: 1,
    confirmedAt: null,
    confirmedBy: null,
  },
  // 6일 전 — 한국어, 확인됨
  {
    id: "c10",
    authorId: "u2",
    lang: "ko",
    targetText: "보고 싶어",
    meaning: "会いたい",
    example: null,
    note: "반말 — 가까운 사이에",
    createdAt: NOW - HOUR * 24 * 6,
    commentCount: 2,
    confirmedAt: NOW - HOUR * 24 * 5,
    confirmedBy: "u1",
  },
];

/** 최신순 정렬해서 반환 */
export function getMockCardsSorted(): FeedCard[] {
  return [...mockCards].sort((a, b) => b.createdAt - a.createdAt);
}
