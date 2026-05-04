import * as React from "react";
import type { FuriganaPart } from "@dorandoran/shared";

/**
 * 후리가나 렌더 — FuriganaPart[] 기반 모노 루비 (한자별 매핑).
 * - parts 없거나 빈 배열 → plain text
 * - 각 part는 base + 옵셔널 ruby
 * - ruby가 있으면 <ruby><rt> 렌더, 없으면 그냥 <span>
 */
export const Furigana = React.memo(FuriganaImpl);

function FuriganaImpl({
  text,
  parts,
}: {
  text: string;
  parts: FuriganaPart[] | null | undefined;
}) {
  if (!parts || parts.length === 0) {
    return <>{text}</>;
  }
  return (
    <>
      {parts.map((part, i) =>
        part.ruby ? (
          <ruby key={i}>
            {part.base}
            <rt>{part.ruby}</rt>
          </ruby>
        ) : (
          <span key={i}>{part.base}</span>
        ),
      )}
    </>
  );
}
