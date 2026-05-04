import type { FuriganaPart } from "@dorandoran/shared";

const KANJI_RE = /\p{Script=Han}/u;

export function isKanji(ch: string): boolean {
  return KANJI_RE.test(ch);
}

export function hasKanji(text: string): boolean {
  return KANJI_RE.test(text);
}

/**
 * targetText에서 한자 위치를 추출.
 * 각 한자 char마다 char index를 반환 — per-kanji 입력 UI에 사용.
 */
export function getKanjiPositions(text: string): { index: number; char: string }[] {
  const result: { index: number; char: string }[] = [];
  let idx = 0;
  // Iterate by code point so surrogate pairs (rare in jp but possible) are handled
  for (const ch of text) {
    if (isKanji(ch)) {
      result.push({ index: idx, char: ch });
    }
    idx += ch.length;
  }
  return result;
}

/**
 * targetText + 한자 인덱스 → 읽기 매핑을 받아서 FuriganaPart[] 생성.
 *
 * 알고리즘 — 빈칸은 "앞 한자와 그룹 묶음"으로 해석:
 *  1. targetText를 char별로 순회
 *  2. 한자 만나고 reading 있음 → 새 그룹 시작
 *  3. 한자 만나고 reading 비었음 → 이전 그룹에 합쳐 (group ruby)
 *      이전 그룹 없으면 → ruby:null로 단독
 *  4. 한자 아닌 char (카나/조사 등) → 이전 그룹 flush, ruby:null로 추가
 *  5. 연속된 카나/조사는 한 part로 합침 (가독성)
 *
 * 예시:
 *  - 月曜日 + {0:"げつ", 1:"よう", 2:"び"}
 *      → [{base:"月",ruby:"げつ"}, {base:"曜",ruby:"よう"}, {base:"日",ruby:"び"}]
 *  - 今日 + {0:"きょう", 1:""}  (두 번째 빈칸)
 *      → [{base:"今日", ruby:"きょう"}]  (그룹 루비, 숙자훈)
 *  - 今日は天気 + {0:"きょう", 1:"", 3:"てん", 4:"き"}
 *      → [{base:"今日", ruby:"きょう"}, {base:"は", ruby:null},
 *          {base:"天", ruby:"てん"}, {base:"気", ruby:"き"}]
 */
export function buildFurigana(
  text: string,
  readingByIndex: Record<number, string>,
): FuriganaPart[] {
  if (!text) return [];

  const parts: FuriganaPart[] = [];
  let kanjiBuf: string[] = []; // 현재 그룹 누적 한자
  let kanjiBufRuby: string | null = null; // 현재 그룹의 reading
  let kanaBuf = "";

  const flushKanji = () => {
    if (kanjiBuf.length > 0) {
      parts.push({ base: kanjiBuf.join(""), ruby: kanjiBufRuby });
      kanjiBuf = [];
      kanjiBufRuby = null;
    }
  };
  const flushKana = () => {
    if (kanaBuf.length > 0) {
      parts.push({ base: kanaBuf, ruby: null });
      kanaBuf = "";
    }
  };

  let idx = 0;
  for (const ch of text) {
    if (isKanji(ch)) {
      flushKana();
      const reading = (readingByIndex[idx] ?? "").trim();
      if (reading) {
        // 새 그룹 시작 → 이전 그룹 flush
        flushKanji();
        kanjiBuf = [ch];
        kanjiBufRuby = reading;
      } else if (kanjiBuf.length > 0) {
        // 빈칸 → 앞 그룹에 추가 (group ruby)
        kanjiBuf.push(ch);
      } else {
        // 빈칸 + 앞 그룹 없음 → 단독 (ruby 없음)
        parts.push({ base: ch, ruby: null });
      }
    } else {
      flushKanji();
      kanaBuf += ch;
    }
    idx += ch.length;
  }
  flushKanji();
  flushKana();

  return parts;
}

/**
 * 기존 FuriganaPart[]를 per-kanji index 매핑으로 풀어서 폼 초기값에 사용.
 * group ruby (한자 2개 이상에 reading 1개)는 첫 한자에 reading 넣고 나머지는 빈칸.
 */
export function unbuildFurigana(
  text: string,
  parts: FuriganaPart[] | null,
): Record<number, string> {
  const result: Record<number, string> = {};
  if (!parts || parts.length === 0) return result;

  // text 전체와 parts.base를 순서대로 매칭
  let textCursor = 0;
  for (const part of parts) {
    const partLen = part.base.length;
    if (part.ruby && partLen > 0) {
      // 첫 한자 위치에 ruby 저장
      // textCursor부터 첫 한자 글자 위치 찾기
      let kanjiAt = -1;
      for (let i = 0; i < partLen; i++) {
        const ch = text[textCursor + i];
        if (ch && isKanji(ch)) {
          kanjiAt = textCursor + i;
          break;
        }
      }
      if (kanjiAt >= 0) result[kanjiAt] = part.ruby;
    }
    textCursor += partLen;
  }
  return result;
}
