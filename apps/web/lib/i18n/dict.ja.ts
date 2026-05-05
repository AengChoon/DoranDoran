import type { Dict } from "./dict.ko";

/**
 * 일본어 번역 — Dict 타입으로 ko 사전 모양 강제.
 * 키 누락 시 컴파일 에러.
 */
export const ja: Dict = {
  common: {
    appName: "ドランドラン",
    appTagline: "ふたりでドランドラン",
  },
  login: {
    tagline: "今日もふたりでドランドラン。",
    helper: "メールひとつで始められます。",
    emailPlaceholder: "you@example.com",
    requestCta: "コードを送る",
    sendingCta: "送信中…",
    invalidEmail: "メールアドレスをご確認ください",
    pinSentTo: "{email}に\n6桁のコードを送りました。",
    pinPlaceholder: "● ● ● ● ● ●",
    verifyCta: "ログイン",
    verifyingCta: "確認中…",
    tryDifferentEmail: "別のメールアドレスで試す",
    devCodeAutofill: "🚀 dev コード自動入力 ({code})",
    invalidCode: "コードが正しくないか期限切れです",
    unknownError: "確認中に問題が発生しました",
  },
  onboarding: {
    welcome: "ようこそ!",
    avatarLabel: "プロフィール画像アップロード",
    avatarHelper: "プロフィール画像 (任意)",
    nameLabel: "呼び名",
    namePlaceholder: "さくら",
    nameRequired: "お名前を入力してください",
    nativeLangLabel: "母国語",
    langKo: "🇰🇷 韓国語",
    langJa: "🇯🇵 日本語",
    learningHint: "学習する言語: {lang} (自動)",
    langKoName: "韓国語",
    langJaName: "日本語",
    imagesOnly: "画像ファイルのみ可能です",
    imageLoadFail: "画像を読み込めませんでした",
    saveError: "保存中に問題が発生しました。しばらくしてからもう一度お試しください。",
    savingCta: "保存中…",
    startCta: "ドランドランをはじめる",
  },
  feedHeader: {
    brand: "ふたりでドランドラン",
    searchPlaceholder: "学習した語",
    searchAria: "カード検索",
    calendarAria: "日付へ移動",
    searchOpenAria: "検索",
    prevMatchAria: "前の一致",
    nextMatchAria: "次の一致",
    searchCloseAria: "検索を閉じる",
  },
  locale: {
    switchToJa: "日本語",
    switchToKo: "한국어",
    switchAria: "言語切り替え",
  },
};
