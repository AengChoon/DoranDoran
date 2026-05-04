/**
 * 날짜 라벨 — 카드 createdAt를 보고 사람 친화적 그룹 키로 변환.
 *
 *  - 오늘
 *  - 어제
 *  - 일주일 이내 → 요일명 ("월요일", "화요일")
 *  - 같은 해 → "5월 4일"
 *  - 다른 해 → "2025년 12월 3일"
 */

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];

/** YYYY-MM-DD 형식. 캘린더 점프, ref id 등에 사용. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function dayLabel(ts: number, now: number = Date.now()): string {
  const d = new Date(ts);
  const today = new Date(now);

  if (sameDay(d, today)) return "오늘";

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (sameDay(d, yesterday)) return "어제";

  // 일주일 이내 — 요일명
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  if (d.getTime() > sevenDaysAgo.getTime()) {
    return WEEKDAYS[d.getDay()] ?? "";
  }

  // 같은 해
  if (d.getFullYear() === today.getFullYear()) {
    return `${d.getMonth() + 1}월 ${d.getDate()}일`;
  }

  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
}

export type DayGroup<T> = {
  label: string;
  /** YYYY-MM-DD — 캘린더 점프 ref 매칭용 */
  dateKey: string;
  items: T[];
};

/**
 * createdAt 내림차순 정렬된 cards 배열을 받아 라벨별로 묶음.
 * 입력 순서가 유지된 그룹 배열 반환.
 */
export function groupByDay<T extends { createdAt: number }>(
  items: T[],
  now: number = Date.now(),
): DayGroup<T>[] {
  const groups: DayGroup<T>[] = [];
  let lastKey: string | null = null;
  for (const item of items) {
    const d = new Date(item.createdAt);
    const key = dayKey(d);
    if (key !== lastKey) {
      groups.push({ label: dayLabel(item.createdAt, now), dateKey: key, items: [item] });
      lastKey = key;
    } else {
      groups[groups.length - 1]!.items.push(item);
    }
  }
  return groups;
}
