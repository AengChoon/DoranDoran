/**
 * 한국어 번역 사전 — 사전 모양의 single source.
 * dict.ja.ts는 이 사전과 같은 shape을 따라야 함 (Dict 타입 강제).
 */
export const ko = {
  common: {
    appName: "도란도란",
    appTagline: "둘이서 도란도란",
  },
  login: {
    tagline: "오늘도 둘이서 도란도란.",
    helper: "이메일 한 줄이면 시작할 수 있어요.",
    emailPlaceholder: "you@example.com",
    requestCta: "코드 받기",
    sendingCta: "보내는 중…",
    invalidEmail: "이메일을 다시 확인해주세요",
    pinSentTo: "{email}로\n6자리 코드를 보냈어요.",
    pinPlaceholder: "● ● ● ● ● ●",
    verifyCta: "로그인",
    verifyingCta: "확인 중…",
    tryDifferentEmail: "다른 이메일로 다시 시도",
    devCodeAutofill: "🚀 dev 코드 자동 입력 ({code})",
    invalidCode: "코드가 맞지 않거나 만료됐어요",
    unknownError: "확인 중 문제가 생겼어요",
  },
  onboarding: {
    welcome: "환영해요!",
    avatarLabel: "프로필 사진 업로드",
    avatarHelper: "프로필 사진 (선택)",
    nameLabel: "부를 이름",
    namePlaceholder: "앵춘",
    nameRequired: "이름을 입력해주세요",
    nativeLangLabel: "모국어",
    langKo: "🇰🇷 한국어",
    langJa: "🇯🇵 일본어",
    /** {lang}는 학습할 언어 이름 (한국어/일본어) */
    learningHint: "학습할 언어: {lang} (자동)",
    langKoName: "한국어",
    langJaName: "일본어",
    imagesOnly: "이미지 파일만 가능해요",
    imageLoadFail: "이미지를 불러올 수 없어요",
    saveError: "저장 중 문제가 생겼어요. 잠시 후 다시 시도해주세요.",
    savingCta: "저장 중…",
    startCta: "도란도란 시작하기",
  },
  feedHeader: {
    brand: "둘이서 도란도란",
    searchPlaceholder: "학습 단어",
    searchAria: "카드 검색",
    calendarAria: "날짜로 이동",
    searchOpenAria: "검색",
    prevMatchAria: "이전 매치",
    nextMatchAria: "다음 매치",
    searchCloseAria: "검색 닫기",
  },
  card: {
    fieldTarget: "학습 단어",
    fieldMeaning: "뜻",
    fieldExample: "예문",
    fieldNote: "메모",
    original: "원본",
    corrected: "첨삭본",
    /** 첨삭 진입 버튼 (대기 카드 보는 상대) */
    correct: "첨삭하기",
    /** 첨삭 모드 하단 완료 버튼 */
    correctDone: "첨삭 완료",
    correctSaving: "저장 중…",
    correctEdit: "첨삭 수정",
    correctUndo: "첨삭 취소",
    correctUndoConfirm: "첨삭을 취소할까요?",
    /** 인라인 패널 */
    fieldEdit: "수정",
    fieldComment: "코멘트",
    fieldEditPlaceholder: "첨삭본 입력",
    fieldCommentPlaceholder: "한 줄 설명 (선택)",
    fieldRevert: "원본으로",
    fieldOk: "확인",
    fieldCancel: "취소",
    /** 첨삭 모드 종료 시 변경 사항 표시 */
    cancelCorrect: "취소",
    deleteConfirm: "이 카드를 삭제할까요?",
  },
  locale: {
    /** 언어 토글 버튼 — 현재 locale에서 보여줄 "전환" 라벨 */
    switchToJa: "日本語",
    switchToKo: "한국어",
    switchAria: "언어 변경",
  },
};

export type Dict = typeof ko;
