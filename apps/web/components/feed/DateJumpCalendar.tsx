"use client";
import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { dayKey } from "@/lib/dayLabel";

type Props = {
  open: boolean;
  /** 카드가 존재하는 날짜들 (YYYY-MM-DD) */
  cardDates: Set<string>;
  /** 처음 열 때 표시할 월 — 기본은 가장 최신 카드 월 또는 오늘 */
  initialMonth?: Date;
  onSelect: (dateKey: string) => void;
  onClose: () => void;
};

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

/**
 * 날짜 점프용 미니 캘린더 — Duolingo 톤.
 *
 *  - 카드 있는 날: 진한 글씨 + 초록 점, 탭 가능
 *  - 카드 없는 날: 옅은 회색, 탭 비활성
 *  - 오늘: 초록 링 강조
 *  - 좌우 화살표로 월 이동
 */
export function DateJumpCalendar({
  open,
  cardDates,
  initialMonth,
  onSelect,
  onClose,
}: Props) {
  const todayRef = React.useRef(new Date());
  const [viewMonth, setViewMonth] = React.useState<Date>(
    () => initialMonth ?? startOfMonth(todayRef.current),
  );

  React.useEffect(() => {
    if (open && initialMonth) setViewMonth(startOfMonth(initialMonth));
  }, [open, initialMonth]);

  React.useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const cells = buildMonthCells(viewMonth);
  const todayKey = dayKey(todayRef.current);
  const monthLabel = `${viewMonth.getFullYear()}년 ${viewMonth.getMonth() + 1}월`;

  function gotoPrev() {
    setViewMonth((m) => addMonths(m, -1));
  }
  function gotoNext() {
    setViewMonth((m) => addMonths(m, 1));
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-start justify-center bg-black/40 px-4 pt-16"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="날짜 선택"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-duo-bg border-2 border-duo-border rounded-duo-lg shadow-duo-card p-4"
      >
        {/* 헤더 — 월 네비 */}
        <div className="flex items-center gap-2 mb-3">
          <NavBtn label="이전 달" onClick={gotoPrev}>
            <ChevronLeft className="h-5 w-5" strokeWidth={2.5} />
          </NavBtn>
          <div className="flex-1 text-center text-sm font-extrabold text-duo-text">
            {monthLabel}
          </div>
          <NavBtn label="다음 달" onClick={gotoNext}>
            <ChevronRight className="h-5 w-5" strokeWidth={2.5} />
          </NavBtn>
          <NavBtn label="닫기" onClick={onClose}>
            <X className="h-5 w-5" strokeWidth={2.5} />
          </NavBtn>
        </div>

        {/* 요일 헤더 */}
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((w, i) => (
            <div
              key={w}
              className={cn(
                "text-center text-[11px] font-extrabold py-1",
                i === 0 ? "text-duo-red" : "text-duo-text-muted",
              )}
            >
              {w}
            </div>
          ))}
        </div>

        {/* 날짜 그리드 */}
        <div className="grid grid-cols-7 gap-1">
          {cells.map((cell, idx) => {
            if (!cell) {
              return <div key={`b-${idx}`} className="aspect-square" />;
            }
            const key = dayKey(cell);
            const has = cardDates.has(key);
            const isToday = key === todayKey;
            return (
              <button
                key={key}
                type="button"
                disabled={!has}
                onClick={() => onSelect(key)}
                aria-label={`${cell.getMonth() + 1}월 ${cell.getDate()}일${has ? ", 카드 있음" : ""}`}
                className={cn(
                  "relative aspect-square flex flex-col items-center justify-center rounded-duo-sm",
                  "text-sm font-extrabold transition-colors",
                  isToday && "ring-2 ring-duo-green",
                  has
                    ? "text-duo-text hover:bg-duo-bg-muted active:bg-duo-bg-muted/80 cursor-pointer"
                    : "text-duo-text-muted/40 cursor-not-allowed",
                )}
              >
                <span>{cell.getDate()}</span>
                {has && (
                  <span
                    className="absolute bottom-1 h-1 w-1 rounded-full bg-duo-green"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function NavBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="shrink-0 flex h-9 w-9 items-center justify-center rounded-full text-duo-text hover:bg-duo-bg-muted transition-colors"
    >
      {children}
    </button>
  );
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

/**
 * 한 달 캘린더 셀 생성 — 일요일 시작.
 * 빈 셀(null) + Date 셀로 구성된 배열 반환 (총 길이는 7의 배수).
 */
function buildMonthCells(viewMonth: Date): Array<Date | null> {
  const first = startOfMonth(viewMonth);
  const leading = first.getDay(); // 0(일) ~ 6(토)
  const daysInMonth = new Date(
    viewMonth.getFullYear(),
    viewMonth.getMonth() + 1,
    0,
  ).getDate();
  const cells: Array<Date | null> = [];
  for (let i = 0; i < leading; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}
