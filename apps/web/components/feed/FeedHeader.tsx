"use client";
import * as React from "react";
import { CalendarDays, ChevronDown, ChevronUp, Search, X } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/cn";
import type { FeedUser } from "@/lib/types";

type Props = {
  me: FeedUser;
  partner: FeedUser;
  /** 검색 쿼리 변경 콜백 */
  onSearchChange?: (query: string) => void;
  /** 검색어 매치 개수. 0이면 nav 비활성. */
  matchCount?: number;
  /** 현재 매치 인덱스 (0-based) */
  currentMatchIndex?: number;
  /** 이전 매치로 이동 */
  onPrevMatch?: () => void;
  /** 다음 매치로 이동 */
  onNextMatch?: () => void;
  /** 날짜 점프 캘린더 열기 */
  onOpenCalendar?: () => void;
};

/**
 * Feed 상단 헤더.
 *
 * 두 가지 모드:
 *  - default: 두 사람 아바타 + 타이틀 + 검색 아이콘
 *  - search:  검색 입력 + 매치 nav (이전/다음/n/m) + 닫기
 *
 * 검색 시 카드는 다 보이고, prev/next로 매치 카드 사이를 스크롤 (Ctrl+F 톤).
 */
export function FeedHeader({
  me,
  partner,
  onSearchChange,
  matchCount = 0,
  currentMatchIndex = 0,
  onPrevMatch,
  onNextMatch,
  onOpenCalendar,
}: Props) {
  const [searching, setSearching] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    onSearchChange?.(query);
  }, [query, onSearchChange]);

  React.useEffect(() => {
    if (searching) inputRef.current?.focus();
  }, [searching]);

  function close() {
    setSearching(false);
    setQuery("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") {
      close();
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      if (matchCount === 0) return;
      if (e.shiftKey) onPrevMatch?.();
      else onNextMatch?.();
    }
  }

  const hasMatches = matchCount > 0;

  return (
    <header className="sticky top-0 z-20 bg-white border-b-2 border-duo-border shadow-[0_2px_0_0_rgba(0,0,0,0.04)]">
      <div className="max-w-md mx-auto px-3 h-14 flex items-center gap-2">
        {!searching ? (
          <>
            <div className="flex items-center gap-2 flex-1 min-w-0 pl-1">
              <div className="flex items-center -space-x-2 shrink-0">
                <Avatar name={me.displayName} bg={me.avatarColor} size="md" />
                <Avatar
                  name={partner.displayName}
                  bg={partner.avatarColor}
                  size="md"
                />
              </div>
              <div className="flex flex-col leading-tight min-w-0">
                <span className="text-[11px] font-bold text-duo-text-muted">
                  둘이서 도란도란
                </span>
                <span className="text-sm font-extrabold text-duo-text truncate">
                  {me.displayName}
                  <span className="text-duo-text-muted/60 mx-1">·</span>
                  {partner.displayName}
                </span>
              </div>
            </div>
            {onOpenCalendar && (
              <IconBtn label="날짜로 이동" onClick={onOpenCalendar}>
                <CalendarDays className="h-5 w-5" strokeWidth={2.5} />
              </IconBtn>
            )}
            <IconBtn
              label="검색"
              onClick={() => setSearching(true)}
            >
              <Search className="h-5 w-5" strokeWidth={2.5} />
            </IconBtn>
          </>
        ) : (
          <>
            <Search
              className="h-5 w-5 shrink-0 text-duo-text-muted ml-1"
              strokeWidth={2.5}
              aria-hidden
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="학습 단어"
              aria-label="카드 검색"
              className="flex-1 min-w-0 bg-transparent outline-hidden text-base font-semibold text-duo-text placeholder:font-medium placeholder:text-duo-text-muted"
            />

            {/* 매치 nav */}
            {query.trim() && (
              <div className="flex items-center gap-0.5 shrink-0">
                <span
                  className={cn(
                    "text-xs font-extrabold tabular-nums px-1.5",
                    hasMatches
                      ? "text-duo-text"
                      : "text-duo-text-muted/60",
                  )}
                >
                  {hasMatches ? `${currentMatchIndex + 1}/${matchCount}` : "0/0"}
                </span>
                <IconBtn
                  label="이전 매치"
                  disabled={!hasMatches}
                  onClick={() => onPrevMatch?.()}
                >
                  <ChevronUp className="h-5 w-5" strokeWidth={2.5} />
                </IconBtn>
                <IconBtn
                  label="다음 매치"
                  disabled={!hasMatches}
                  onClick={() => onNextMatch?.()}
                >
                  <ChevronDown className="h-5 w-5" strokeWidth={2.5} />
                </IconBtn>
              </div>
            )}

            <IconBtn label="검색 닫기" onClick={close}>
              <X className="h-5 w-5" strokeWidth={2.5} />
            </IconBtn>
          </>
        )}
      </div>
    </header>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "shrink-0 flex h-9 w-9 items-center justify-center rounded-full",
        "transition-colors",
        disabled
          ? "text-duo-text-muted/40 cursor-not-allowed"
          : "text-duo-text hover:bg-duo-bg-muted",
      )}
    >
      {children}
    </button>
  );
}
