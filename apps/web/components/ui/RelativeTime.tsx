/**
 * "2시간 전" 형태 상대 시간.
 * 30분 미만: "방금 전"
 * 1시간 미만: "n분 전"
 * 24시간 미만: "n시간 전"
 * 그 이상: "n일 전"
 *
 * SSR/CSR 시간 차이로 인한 hydration mismatch는 suppressHydrationWarning으로 무시.
 */
export function RelativeTime({
  ts,
  className,
}: {
  ts: number;
  className?: string;
}) {
  const text = formatRelative(ts, Date.now());
  return (
    <time
      dateTime={new Date(ts).toISOString()}
      className={className}
      suppressHydrationWarning
    >
      {text}
    </time>
  );
}

export function formatRelative(ts: number, now: number = Date.now()): string {
  const diff = now - ts;
  if (diff < 0) return "방금 전";

  const MIN = 60 * 1000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;

  if (diff < 30 * MIN) return "방금 전";
  if (diff < HOUR) return `${Math.round(diff / MIN)}분 전`;
  if (diff < DAY) return `${Math.round(diff / HOUR)}시간 전`;
  return `${Math.round(diff / DAY)}일 전`;
}
