"use client";
import * as React from "react";
import { useLocale, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

export type MascotVariant =
  | "pair"           // 한국 + 일본 말풍선 (기본)
  | "pair-close"     // 두 말풍선이 더 붙어있음 (인사·환영)
  | "pair-thinking"  // 말풍선 안에 점 3개 (Feed 빈 상태)
  | "pair-celebrate" // 말풍선 위에 별 반짝이 (Review 완료)
  | "ko"             // 한국 말풍선 단일 (카드 라벨)
  | "ja";            // 일본 말풍선 단일

export type MascotSize = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<MascotSize, number> = {
  sm: 32,
  md: 80,
  lg: 140,
  xl: 200,
};

type Props = {
  variant?: MascotVariant;
  size?: MascotSize;
  className?: string;
  /** 페어 마스코트의 "위" 자리 — locale 미지정 시 현재 LocaleProvider 값 따름 */
  primary?: Locale;
};

// ─── 색·상수 ──────────────────────────────────────────
const KO_RED = "#CD2E3A";
const KO_BLUE = "#0047A0";
const JP_RED = "#BC002D";
const TRIGRAM_INK = "#000000";
const FLAG_BG = "#FFFFFF";
const FLAG_BORDER = "#D4D4D8";
const DOTS_INK = "#777777";

// ─── 말풍선 path ──────────────────────────────────────
function bubblePath(tailSide: "right" | "left") {
  const tail =
    tailSide === "right"
      ? "L 32 40 L 44 56 L 12 40"
      : "L -12 40 L -44 56 L -32 40";
  return [
    "M -50 -40",
    "H 50",
    "A 10 10 0 0 1 60 -30",
    "V 30",
    "A 10 10 0 0 1 50 40",
    tail,
    "H -50",
    "A 10 10 0 0 1 -60 30",
    "V -30",
    "A 10 10 0 0 1 -50 -40",
    "Z",
  ].join(" ");
}

// ─── 태극 ─────────────────────────────────────────────
function Taegeuk({ r = 18 }: { r?: number }) {
  const half = r / 2;
  return (
    <g transform="rotate(30) scale(-1 1)">
      <circle cx="0" cy="0" r={r} fill={KO_RED} />
      <path
        d={[
          `M ${-r} 0`,
          `A ${half} ${half} 0 0 1 0 0`,
          `A ${half} ${half} 0 0 0 ${r} 0`,
          `A ${r} ${r} 0 0 1 ${-r} 0`,
          "Z",
        ].join(" ")}
        fill={KO_BLUE}
      />
    </g>
  );
}

// ─── 4괘 ──────────────────────────────────────────────
function Trigram({
  x,
  y,
  pattern,
  rotate = 0,
}: {
  x: number;
  y: number;
  pattern: ("s" | "b")[];
  rotate?: number;
}) {
  const W = 16;
  const H = 2.6;
  const GAP = 2.4;
  const totalH = H * 3 + GAP * 2;
  const startY = -totalH / 2;
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate})`}>
      {pattern.map((p, i) => {
        const yPos = startY + i * (H + GAP);
        if (p === "s") {
          return <rect key={i} x={-W / 2} y={yPos} width={W} height={H} fill={TRIGRAM_INK} />;
        }
        const half = (W - 2) / 2;
        return (
          <g key={i}>
            <rect x={-W / 2} y={yPos} width={half} height={H} fill={TRIGRAM_INK} />
            <rect x={2} y={yPos} width={half} height={H} fill={TRIGRAM_INK} />
          </g>
        );
      })}
    </g>
  );
}

function KoreanFlagContent() {
  return (
    <g>
      <Taegeuk r={18} />
      <Trigram x={-38} y={-22} pattern={["s", "s", "s"]} rotate={-45} />
      <Trigram x={38} y={-22} pattern={["b", "s", "b"]} rotate={45} />
      <Trigram x={-38} y={22} pattern={["s", "b", "s"]} rotate={45} />
      <Trigram x={38} y={22} pattern={["b", "b", "b"]} rotate={-45} />
    </g>
  );
}

function JapaneseFlagContent() {
  return <circle cx="0" cy="0" r="20" fill={JP_RED} />;
}

// 말풍선 안에 점 3개 (생각 중)
function ThinkingDots() {
  return (
    <g fill={DOTS_INK}>
      <circle cx="-22" cy="0" r="5" />
      <circle cx="0" cy="0" r="5" />
      <circle cx="22" cy="0" r="5" />
    </g>
  );
}

// 말풍선 한 개 (배경 + 콘텐츠)
function FlagBubble({
  kind,
  tailSide,
}: {
  kind: "ko" | "ja" | "thinking";
  tailSide: "right" | "left";
}) {
  return (
    <g>
      <path
        d={bubblePath(tailSide)}
        fill={FLAG_BG}
        stroke={FLAG_BORDER}
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {kind === "ko" && <KoreanFlagContent />}
      {kind === "ja" && <JapaneseFlagContent />}
      {kind === "thinking" && <ThinkingDots />}
    </g>
  );
}

// 별 모양 (축하)
function Sparkle({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <path
        d="M 0 -7 L 2 -2 L 7 0 L 2 2 L 0 7 L -2 2 L -7 0 L -2 -2 Z"
        fill="#FFC800"
        stroke="#E0A800"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </g>
  );
}

// ─── pair 배치 ────────────────────────────────────────
// primary 쪽이 왼쪽-위, 다른 쪽이 오른쪽-아래로 살짝 비대칭
function PairLayout({
  variant,
  size,
  className,
  primary,
}: {
  variant: Exclude<MascotVariant, "ko" | "ja">;
  size: number;
  className?: string;
  primary: Locale;
}) {
  const isClose = variant === "pair-close";
  const isThinking = variant === "pair-thinking";
  const isCelebrate = variant === "pair-celebrate";

  const gap = isClose ? 110 : 140;
  const cx1 = 80;
  const cx2 = cx1 + gap;
  // 위쪽(y=70), 아래쪽(y=95) — 비대칭
  const cy1 = 70;
  const cy2 = isClose ? 90 : 95;

  // primary가 위, secondary가 아래
  const secondary: Locale = primary === "ko" ? "ja" : "ko";
  const topKind = isThinking ? "thinking" : primary;
  const botKind = isThinking ? "thinking" : secondary;

  const vbWidth = isClose ? 280 : 320;
  const vbHeight = 200;

  const ariaLabel =
    primary === "ja"
      ? "ドランドラン マスコット — 日本語 + 韓国語の吹き出し"
      : "도란도란 마스코트 — 한국 + 일본 말풍선";

  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      width={size}
      height={(size * vbHeight) / vbWidth}
      role="img"
      aria-label={ariaLabel}
      className={cn("select-none overflow-visible", className)}
    >
      {/* 위쪽 (primary) */}
      <g transform={`translate(${cx1} ${cy1})`}>
        <FlagBubble kind={topKind} tailSide="right" />
      </g>

      {/* 아래쪽 (secondary) */}
      <g transform={`translate(${cx2} ${cy2})`}>
        <FlagBubble kind={botKind} tailSide="left" />
      </g>

      {isCelebrate && (
        <g>
          <Sparkle x={50} y={30} scale={1.2} />
          <Sparkle x={vbWidth - 50} y={40} scale={1} />
          <Sparkle x={vbWidth / 2} y={20} scale={0.9} />
          <Sparkle x={30} y={vbHeight - 30} scale={0.7} />
          <Sparkle x={vbWidth - 30} y={vbHeight - 20} scale={0.8} />
        </g>
      )}
    </svg>
  );
}

// ─── 단일 말풍선 ──────────────────────────────────────
function SingleLayout({
  kind,
  size,
  className,
}: {
  kind: "ko" | "ja";
  size: number;
  className?: string;
}) {
  // 단일 말풍선 viewBox: 본체 120w + 꼬리 + 패딩
  const vbWidth = 140;
  const vbHeight = 120;
  return (
    <svg
      viewBox={`0 0 ${vbWidth} ${vbHeight}`}
      width={size}
      height={size}
      role="img"
      aria-label={kind === "ko" ? "한국어" : "일본어"}
      className={cn("select-none overflow-visible", className)}
    >
      <g transform={`translate(${vbWidth / 2} 50)`}>
        <FlagBubble kind={kind} tailSide={kind === "ko" ? "right" : "left"} />
      </g>
    </svg>
  );
}

/**
 * 도란도란 마스코트.
 * - pair / pair-close / pair-thinking / pair-celebrate: primary 위, 다른 쪽 아래
 *   primary 미지정 시 LocaleProvider의 현재 locale 따름
 * - ko / ja: 단일 말풍선 (카드 라벨 등)
 */
export function Mascot({ variant = "pair", size = "lg", className, primary }: Props) {
  const px = SIZE_PX[size];
  const { locale } = useLocale();
  if (variant === "ko" || variant === "ja") {
    return <SingleLayout kind={variant} size={px} className={className} />;
  }
  return (
    <PairLayout
      variant={variant}
      size={px}
      className={className}
      primary={primary ?? locale}
    />
  );
}
