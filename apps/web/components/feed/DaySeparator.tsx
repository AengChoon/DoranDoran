/**
 * 날짜 구분선 — 카카오톡 스타일 가운데 캡슐.
 *
 * 카드 그룹 사이에 들어감. "오늘 / 어제 / 월요일 / 5월 4일" 같은 라벨.
 */
export function DaySeparator({ label }: { label: string }) {
  return (
    <div
      className="flex justify-center my-2"
      role="separator"
      aria-label={label}
    >
      <DaySeparatorPill label={label} />
    </div>
  );
}

/** 캡슐만 — sticky floating header에서도 재사용 */
export function DaySeparatorPill({ label }: { label: string }) {
  return (
    <span className="text-xs font-extrabold tracking-wide text-duo-text-muted bg-duo-bg-muted/80 backdrop-blur-sm rounded-full px-3 py-1">
      {label}
    </span>
  );
}
