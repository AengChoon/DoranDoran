import type { Lang } from "./constants";

const HANGUL_RE = /[가-힯ᄀ-ᇿ㄰-㆏]/;
const KANA_RE = /[぀-ゟ゠-ヿ]/;
const CJK_RE = /[一-鿿]/;

export function detectLang(text: string): Lang | null {
  if (!text) return null;
  let ko = 0;
  let ja = 0;
  for (const ch of text) {
    if (HANGUL_RE.test(ch)) ko++;
    else if (KANA_RE.test(ch)) ja++;
  }
  if (ko === 0 && ja === 0) {
    return CJK_RE.test(text) ? "ja" : null;
  }
  return ko >= ja ? "ko" : "ja";
}
