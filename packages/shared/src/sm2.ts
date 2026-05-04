/**
 * SM-2 알고리즘. quality는 0~5 (3 미만이면 처음부터)
 * Anki·SuperMemo 변형이 아닌 원본 SM-2를 사용.
 */
export type Sm2State = {
  easeFactor: number;
  intervalDays: number;
  repetitions: number;
};

export type Sm2Result = Sm2State & {
  nextReviewAt: number;
};

const MIN_EASE = 1.3;
const DAY_MS = 24 * 60 * 60 * 1000;

export function nextReview(prev: Sm2State, quality: number, now = Date.now()): Sm2Result {
  const q = Math.max(0, Math.min(5, Math.round(quality)));
  let { easeFactor, intervalDays, repetitions } = prev;

  if (q < 3) {
    repetitions = 0;
    intervalDays = 1;
  } else {
    repetitions += 1;
    if (repetitions === 1) intervalDays = 1;
    else if (repetitions === 2) intervalDays = 6;
    else intervalDays = Math.round(intervalDays * easeFactor);
  }

  easeFactor = Math.max(
    MIN_EASE,
    easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)),
  );

  return {
    easeFactor: Number(easeFactor.toFixed(3)),
    intervalDays,
    repetitions,
    nextReviewAt: now + intervalDays * DAY_MS,
  };
}

export const initialSm2: Sm2State = {
  easeFactor: 2.5,
  intervalDays: 0,
  repetitions: 0,
};
