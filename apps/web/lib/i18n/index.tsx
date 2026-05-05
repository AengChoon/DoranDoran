"use client";
import * as React from "react";
import { ko, type Dict } from "./dict.ko";
import { ja } from "./dict.ja";

export type Locale = "ko" | "ja";
export const LOCALES = ["ko", "ja"] as const satisfies readonly Locale[];

const DICTS: Record<Locale, Dict> = { ko, ja };
const STORAGE_KEY = "doran-locale";

/**
 * "{name}" 형태 placeholder 보간. 누락된 key는 빈 문자열.
 *   format("Hello {name}", { name: "준" }) → "Hello 준"
 */
export function format(
  template: string,
  params: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => {
    const v = params[k];
    return v == null ? "" : String(v);
  });
}

type Ctx = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dict;
};

const LocaleContext = React.createContext<Ctx | null>(null);

function pickInitialLocale(): Locale {
  if (typeof window === "undefined") return "ko";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "ko" || saved === "ja") return saved;
  } catch {
    // localStorage 막힌 환경(시크릿 모드 등) — navigator로 fallback
  }
  // navigator.language: "ja", "ja-JP" → ja, 그 외 → ko (기본)
  if (typeof navigator !== "undefined" && /^ja\b/i.test(navigator.language)) {
    return "ja";
  }
  return "ko";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // 초기값은 SSR/hydration 안전하게 ko로 시작 → mount 후 실제 결정
  // (정적 export 호환 — 서버에서는 navigator/localStorage 못 봄)
  const [locale, setLocaleState] = React.useState<Locale>("ko");

  React.useEffect(() => {
    setLocaleState(pickInitialLocale());
  }, []);

  // body의 lang 속성도 따라 갱신 — :lang(ja) CSS selector가 일본어 폰트 적용
  React.useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = React.useCallback((l: Locale) => {
    setLocaleState(l);
    try {
      window.localStorage.setItem(STORAGE_KEY, l);
    } catch {
      // 저장 실패는 무시 — 메모리 상태는 유지됨
    }
  }, []);

  const value = React.useMemo<Ctx>(
    () => ({ locale, setLocale, t: DICTS[locale] }),
    [locale, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

function useLocaleCtx(): Ctx {
  const ctx = React.useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used inside <LocaleProvider>");
  return ctx;
}

export function useLocale(): { locale: Locale; setLocale: (l: Locale) => void } {
  const { locale, setLocale } = useLocaleCtx();
  return { locale, setLocale };
}

/**
 * 사전을 직접 반환 — 컴포넌트는 `const t = useT(); t.login.tagline` 식으로 사용.
 * 이 모양이 nested 객체 자동완성·타입체크가 자연스럽고, key string 오타 위험 X.
 */
export function useT(): Dict {
  return useLocaleCtx().t;
}
