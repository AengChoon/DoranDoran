"use client";
import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { CardWithMeta } from "@dorandoran/shared";
import { CardDetailModal } from "@/components/card/CardDetailModal";
import { CardItem } from "@/components/feed/CardItem";
import { DateJumpCalendar } from "@/components/feed/DateJumpCalendar";
import { DaySeparator, DaySeparatorPill } from "@/components/feed/DaySeparator";
import { EmptyState } from "@/components/feed/EmptyState";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  cardMatchesQuery,
  useCardsList,
  useHasEarlierCards,
} from "@/lib/api/cards";
import { useMe } from "@/lib/api/me";
import { dayKey, groupByDay } from "@/lib/dayLabel";
import type { Lang } from "@/lib/types";

const AVATAR_COLOR: Record<Lang, string> = {
  ko: "#58CC02",
  ja: "#FF6B6B",
};

const DAY_MS = 24 * 60 * 60 * 1000;
const PAGE_DAYS = 60;
/** 헤더 sticky 높이 (px) — 가상화 scroll-margin / sticky 라벨 위치 계산용 */
const HEADER_H = 56;

type FlatItem =
  | { kind: "sep"; key: string; dateKey: string; label: string }
  | { kind: "card"; key: string; card: CardWithMeta }
  | { kind: "load-more"; key: "__load-more__" };

type PendingJump =
  | { type: "date"; key: string }
  | { type: "card"; key: string };

export default function FeedPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showEmpty = searchParams.get("empty") === "1";
  const deepLinkCardId = searchParams.get("card");

  const me = useMe();

  // 검색 상태
  const [query, setQuery] = React.useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = React.useState(0);
  const isSearching = query.trim().length > 0;

  // 페이지네이션 — 평소엔 최근 PAGE_DAYS일, 검색 중엔 전체
  const [sinceTs, setSinceTs] = React.useState<number>(
    () => Date.now() - PAGE_DAYS * DAY_MS,
  );
  const effectiveSince = isSearching ? null : sinceTs;
  const allCards = useCardsList(effectiveSince);
  const hasEarlier = useHasEarlierCards(effectiveSince);

  // 매치 카드
  const matches = React.useMemo(() => {
    if (!allCards) return [];
    const q = query.trim();
    if (!q) return [];
    return allCards.filter((c) => cardMatchesQuery(c, q));
  }, [allCards, query]);

  const matchIds = React.useMemo(
    () => new Set(matches.map((m) => m.id)),
    [matches],
  );
  const currentMatchId = matches[currentMatchIndex]?.id;

  // 매치 변경 시 인덱스 리셋
  React.useEffect(() => {
    setCurrentMatchIndex(0);
  }, [matches]);

  function nextMatch() {
    if (matches.length === 0) return;
    setCurrentMatchIndex((i) => (i + 1) % matches.length);
  }
  function prevMatch() {
    if (matches.length === 0) return;
    setCurrentMatchIndex(
      (i) => (i - 1 + matches.length) % matches.length,
    );
  }

  // 날짜 그룹
  const groups = React.useMemo(
    () => groupByDay(showEmpty ? [] : (allCards ?? [])),
    [allCards, showEmpty],
  );

  // 가상화용 평탄 리스트
  const flatItems = React.useMemo<FlatItem[]>(() => {
    const items: FlatItem[] = [];
    for (const g of groups) {
      items.push({
        kind: "sep",
        key: `sep-${g.dateKey}`,
        dateKey: g.dateKey,
        label: g.label,
      });
      for (const card of g.items) {
        items.push({ kind: "card", key: `card-${card.id}`, card });
      }
    }
    if (!isSearching && hasEarlier) {
      items.push({ kind: "load-more", key: "__load-more__" });
    }
    return items;
  }, [groups, hasEarlier, isSearching]);

  // 캘린더용 — 카드가 존재하는 날짜 집합
  const cardDates = React.useMemo(
    () => new Set(groups.map((g) => g.dateKey)),
    [groups],
  );
  const initialMonth = React.useMemo(() => {
    const first = groups[0];
    if (!first) return undefined;
    const [y, m] = first.dateKey.split("-").map(Number);
    return new Date(y!, m! - 1, 1);
  }, [groups]);

  // 캘린더 모달 상태
  const [calendarOpen, setCalendarOpen] = React.useState(false);

  // ── 가상화 ─────────────────────────────────────────────
  // parentRef는 자체 스크롤 컨테이너. layout이 외부 스크롤을 차단해서
  // 피드 영역만 스크롤됨 (헤더/탭바 고정).
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (i) => {
      const it = flatItems[i];
      if (!it) return 100;
      if (it.kind === "sep") return 36;
      if (it.kind === "load-more") return 64;
      // card — 후리가나 / 메모 없으면 더 짧음. 평균 추정.
      return 110;
    },
    overscan: 6,
    getItemKey: (i) => flatItems[i]?.key ?? i,
  });

  // ── 점프 처리 (검색 매치 / 캘린더 / 더 보기 등) ───────
  const [pendingJump, setPendingJump] = React.useState<PendingJump | null>(
    null,
  );

  // currentMatch 변경 시 자동 점프 (디바운스로 빠른 입력 중에는 안 흔들리게)
  React.useEffect(() => {
    if (!currentMatchId) return;
    const t = setTimeout(() => {
      setPendingJump({ type: "card", key: currentMatchId });
    }, 150);
    return () => clearTimeout(t);
  }, [currentMatchId]);

  // pendingJump 처리 — flatItems 또는 jump 변경 시
  React.useEffect(() => {
    if (!pendingJump) return;
    let idx = -1;
    if (pendingJump.type === "card") {
      idx = flatItems.findIndex(
        (it) => it.kind === "card" && it.card.id === pendingJump.key,
      );
    } else {
      idx = flatItems.findIndex(
        (it) => it.kind === "sep" && it.dateKey === pendingJump.key,
      );
    }
    if (idx < 0) return; // 아직 로드 안 됨 — sinceTs 확장 후 재시도
    virtualizer.scrollToIndex(idx, {
      align: pendingJump.type === "card" ? "center" : "start",
    });
    setPendingJump(null);
  }, [flatItems, pendingJump, virtualizer]);

  function jumpToDay(key: string) {
    setCalendarOpen(false);
    // 선택 날짜가 현재 로드 범위 밖이면 sinceTs를 그 날짜까지 확장
    const [y, m, d] = key.split("-").map(Number);
    const dayTs = new Date(y!, m! - 1, d!).getTime();
    if (!isSearching && dayTs < sinceTs) {
      setSinceTs(dayTs);
    }
    setPendingJump({ type: "date", key });
  }

  function loadEarlier() {
    setSinceTs((prev) => prev - PAGE_DAYS * DAY_MS);
  }

  // ── 모달 닫기 — ?card 쿼리만 제거. history.back은 외부 entry로 튕길 수
  // 있어 항상 replace로 통일. (시스템 백 버튼은 그대로 직전 entry로 동작)
  const closeModal = React.useCallback(() => {
    router.replace("/feed", { scroll: false });
  }, [router]);

  // ── 모달 열린 카드로 피드 스크롤 (직접 진입 시 모달 뒤 피드가 그 위치로) ─
  // 같은 카드는 한 번만. 카드가 sinceTs 밖이면 전체 로드해서 다시 시도.
  const processedJumpRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (!deepLinkCardId) {
      processedJumpRef.current = null;
      return;
    }
    if (processedJumpRef.current === deepLinkCardId) return;
    if (allCards === undefined) return;
    const found = allCards.some((c) => c.id === deepLinkCardId);
    if (!found) {
      if (!isSearching && sinceTs > 0) setSinceTs(0);
      return;
    }
    processedJumpRef.current = deepLinkCardId;
    setPendingJump({ type: "card", key: deepLinkCardId });
  }, [deepLinkCardId, allCards, isSearching, sinceTs]);

  // ── 가상화 — sticky day header (현재 가시 영역의 그룹 라벨) ─
  // viewport 상단을 가리는 아이템이 separator면 → 그 라벨이 이미 화면에 있으니 floating은 숨김.
  // 카드면 → 직전 separator의 라벨을 floating으로 표시.
  const virtualItems = virtualizer.getVirtualItems();
  const stickyLabel = React.useMemo(() => {
    const offset = virtualizer.scrollOffset ?? 0;
    let activeIdx = -1;
    for (const vi of virtualItems) {
      if (vi.start + vi.size > offset) {
        activeIdx = vi.index;
        break;
      }
    }
    if (activeIdx < 0) return null;
    const activeItem = flatItems[activeIdx];
    // 현재 separator가 viewport 상단을 가리고 있으면 그게 보이니 floating 중복 표시 안 함
    if (activeItem?.kind === "sep") return null;
    for (let i = activeIdx; i >= 0; i--) {
      const it = flatItems[i];
      if (it?.kind === "sep") return it.label;
    }
    return null;
  }, [virtualItems, flatItems, virtualizer.scrollOffset]);

  if (me.isLoading || allCards === undefined) {
    return <FeedSkeleton />;
  }

  if (me.error || !me.user) {
    return (
      <main className="max-w-md mx-auto px-4 py-12 text-center text-duo-text-muted">
        사용자 정보를 불러오지 못했어요.
      </main>
    );
  }

  const hasAnyCard = flatItems.some((it) => it.kind === "card");
  const meUser = me.user;

  return (
    <>
      <FeedHeader
        me={{
          id: meUser.id,
          displayName: meUser.displayName,
          nativeLang: meUser.nativeLang,
          avatarColor: AVATAR_COLOR[meUser.nativeLang],
        }}
        partner={
          me.partner
            ? {
                id: me.partner.id,
                displayName: me.partner.displayName,
                nativeLang: me.partner.nativeLang,
                avatarColor: AVATAR_COLOR[me.partner.nativeLang],
              }
            : {
                id: "—",
                displayName: "—",
                nativeLang: "ja",
                avatarColor: "#E5E5E5",
              }
        }
        onSearchChange={setQuery}
        matchCount={matches.length}
        currentMatchIndex={currentMatchIndex}
        onPrevMatch={prevMatch}
        onNextMatch={nextMatch}
        onOpenCalendar={hasAnyCard ? () => setCalendarOpen(true) : undefined}
      />

      {/* sticky day floating header — 가상화 윈도우의 첫 가시 그룹 라벨 */}
      {stickyLabel && hasAnyCard && (
        <div
          className="fixed left-0 right-0 z-10 flex justify-center pt-2 pointer-events-none"
          style={{ top: HEADER_H }}
        >
          <DaySeparatorPill label={stickyLabel} />
        </div>
      )}

      {/* 스크롤 컨테이너 — 헤더/탭바 사이 영역만 스크롤 */}
      <main
        ref={parentRef}
        className="overflow-y-auto overscroll-contain"
        style={{
          height:
            "calc(100svh - 56px - 56px - env(safe-area-inset-bottom))",
        }}
      >
        <div className="max-w-md mx-auto px-4 py-4">
          {!hasAnyCard ? (
            <EmptyState />
          ) : (
            <div
              style={{
                height: virtualizer.getTotalSize(),
                position: "relative",
              }}
            >
              {virtualItems.map((vi) => {
                const item = flatItems[vi.index];
                if (!item) return null;
                return (
                  <div
                    key={vi.key}
                    data-index={vi.index}
                    ref={virtualizer.measureElement}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      transform: `translateY(${vi.start}px)`,
                    }}
                  >
                    <FlatRow
                      item={item}
                      meId={meUser.id}
                      matchIds={matchIds}
                      currentMatchId={currentMatchId}
                      onLoadEarlier={loadEarlier}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <DateJumpCalendar
        open={calendarOpen}
        cardDates={cardDates}
        initialMonth={initialMonth}
        onSelect={jumpToDay}
        onClose={() => setCalendarOpen(false)}
      />

      <CardDetailModal cardId={deepLinkCardId} onClose={closeModal} />
    </>
  );
}

function FlatRow({
  item,
  meId,
  matchIds,
  currentMatchId,
  onLoadEarlier,
}: {
  item: FlatItem;
  meId: string;
  matchIds: Set<string>;
  currentMatchId: string | undefined;
  onLoadEarlier: () => void;
}) {
  if (item.kind === "sep") {
    return (
      <div data-date-key={item.dateKey}>
        <DaySeparator label={item.label} />
      </div>
    );
  }
  if (item.kind === "load-more") {
    return (
      <div className="flex justify-center py-4">
        <Button variant="ghost" size="sm" onClick={onLoadEarlier}>
          이전 카드 더 보기
        </Button>
      </div>
    );
  }
  return (
    <div className="pb-3">
      <CardItem
        card={item.card}
        isMine={item.card.authorId === meId}
        isMatch={matchIds.has(item.card.id)}
        isCurrent={item.card.id === currentMatchId}
      />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <main className="max-w-md mx-auto px-4 py-4">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-24 w-3/4 ml-auto" />
        <Skeleton className="h-24 w-3/4" />
        <Skeleton className="h-32 w-3/4 ml-auto" />
        <Skeleton className="h-20 w-3/4" />
      </div>
    </main>
  );
}
