import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { cards, users } from "@dorandoran/db";
import { env, ownerEmails } from "./env";
import { getDb } from "./db";
import { authRoutes } from "./routes/auth";
import { cardRoutes } from "./routes/cards";
import { reviewRoutes } from "./routes/review";
import { pushRoutes } from "./routes/push";
import { syncRoutes } from "./routes/sync";

// 부팅 시 DB 초기화(getDb 내부) + 오너 사용자 시드 (없을 때만)
function bootstrap() {
  const db = getDb();
  const owners = [...ownerEmails];
  owners.forEach((email, idx) => {
    const exists = db.select().from(users).where(eq(users.email, email)).get();
    if (!exists) {
      db.insert(users)
        .values({
          id: nanoid(),
          email,
          displayName: idx === 0 ? "나" : "파트너",
          nativeLang: idx === 0 ? "ko" : "ja",
          learningLang: idx === 0 ? "ja" : "ko",
        })
        .run();
      console.log(`[api] seeded owner user: ${email}`);
    }
  });

  seedTestCards();
}

/**
 * 테스트용 시드 카드 — id 고정으로 idempotent. 이미 있으면 스킵.
 *
 * 다양한 시나리오:
 *  - 한국어 / 일본어 양쪽
 *  - 본인 / 파트너 작성
 *  - 확인됨 / 대기 분포
 *  - 짧은 단어 ~ 긴 문장
 *  - 한자 있음 / 없음 / 숙자훈 / 연탁
 *  - 30일 전부터 30분 전까지 분포 (날짜 구분선 다양)
 */
type SeedCard = {
  id: string;
  who: "me" | "partner";
  lang: "ko" | "ja";
  targetText: string;
  meaning: string;
  example?: string;
  note?: string;
  furigana?: { base: string; ruby: string | null }[];
  /** 작성 시점: 지금부터 몇 시간 전 */
  hoursAgo: number;
  confirmed?: boolean;
};

const HOUR = 1000 * 60 * 60;
const DAY = HOUR * 24;

const SEEDS: SeedCard[] = [
  // ── 오늘
  {
    id: "seed-today-1",
    who: "me",
    lang: "ja",
    targetText: "月曜日",
    meaning: "월요일",
    furigana: [
      { base: "月", ruby: "げつ" },
      { base: "曜", ruby: "よう" },
      { base: "日", ruby: "び" },
    ],
    hoursAgo: 1,
    confirmed: true,
  },
  {
    id: "seed-today-2",
    who: "partner",
    lang: "ko",
    targetText: "안녕히 가세요",
    meaning: "さようなら",
    example: "헤어질 때 안녕히 가세요라고 해요",
    hoursAgo: 3,
    confirmed: true,
  },
  {
    id: "seed-today-3",
    who: "me",
    lang: "ja",
    targetText: "雨が降る",
    meaning: "비가 내리다",
    example: "今日は雨が降ります",
    furigana: [
      { base: "雨", ruby: "あめ" },
      { base: "が", ruby: null },
      { base: "降", ruby: "ふ" },
      { base: "る", ruby: null },
    ],
    hoursAgo: 6,
  },

  // ── 어제 (24~48h ago)
  {
    id: "seed-yest-1",
    who: "partner",
    lang: "ko",
    targetText: "화이팅",
    meaning: "頑張って",
    note: "응원할 때 자주 써요",
    hoursAgo: 26,
  },
  {
    id: "seed-yest-2",
    who: "me",
    lang: "ja",
    targetText: "美味しい",
    meaning: "맛있다",
    example: "このラーメン本当に美味しい",
    furigana: [
      { base: "美味", ruby: "おい" },
      { base: "しい", ruby: null },
    ],
    hoursAgo: 30,
    confirmed: true,
  },
  {
    id: "seed-yest-3",
    who: "me",
    lang: "ja",
    targetText: "コーヒー",
    meaning: "커피",
    hoursAgo: 36,
    confirmed: true,
  },

  // ── 2일 전
  {
    id: "seed-d2-1",
    who: "partner",
    lang: "ko",
    targetText: "떡볶이가 매워요",
    meaning: "トッポッキが辛いです",
    example: "떡볶이가 너무 매워요",
    note: "「-아/어요」는 정중한 평서형",
    hoursAgo: 50,
    confirmed: true,
  },
  {
    id: "seed-d2-2",
    who: "me",
    lang: "ja",
    targetText: "仕事",
    meaning: "일",
    furigana: [
      { base: "仕", ruby: "し" },
      { base: "事", ruby: "ごと" },
    ],
    hoursAgo: 56,
  },

  // ── 3일 전
  {
    id: "seed-d3-1",
    who: "partner",
    lang: "ko",
    targetText: "사랑해",
    meaning: "愛してる",
    note: "반말 — 가까운 사이",
    hoursAgo: 24 * 3 + 2,
    confirmed: true,
  },
  {
    id: "seed-d3-2",
    who: "me",
    lang: "ja",
    targetText: "寒い",
    meaning: "춥다",
    furigana: [
      { base: "寒", ruby: "さむ" },
      { base: "い", ruby: null },
    ],
    hoursAgo: 24 * 3 + 8,
    confirmed: true,
  },

  // ── 5일 전
  {
    id: "seed-d5-1",
    who: "me",
    lang: "ja",
    targetText: "一緒に映画を見ましょう",
    meaning: "같이 영화 봐요",
    furigana: [
      { base: "一", ruby: "いっ" },
      { base: "緒", ruby: "しょ" },
      { base: "に", ruby: null },
      { base: "映", ruby: "えい" },
      { base: "画", ruby: "が" },
      { base: "を", ruby: null },
      { base: "見", ruby: "み" },
      { base: "ましょう", ruby: null },
    ],
    hoursAgo: 24 * 5 + 3,
  },
  {
    id: "seed-d5-2",
    who: "partner",
    lang: "ko",
    targetText: "그래서 어떻게 됐어요?",
    meaning: "それでどうなりましたか?",
    hoursAgo: 24 * 5 + 10,
    confirmed: true,
  },

  // ── 일주일 전 (요일명)
  {
    id: "seed-d7-1",
    who: "partner",
    lang: "ko",
    targetText: "어디 가세요?",
    meaning: "どこへ行きますか?",
    example: "지금 어디 가세요?",
    hoursAgo: 24 * 7 + 4,
    confirmed: true,
  },
  {
    id: "seed-d8-1",
    who: "me",
    lang: "ja",
    targetText: "駅",
    meaning: "역",
    furigana: [{ base: "駅", ruby: "えき" }],
    hoursAgo: 24 * 8 + 2,
    confirmed: true,
  },

  // ── 10일 전
  {
    id: "seed-d10-1",
    who: "partner",
    lang: "ko",
    targetText: "화요일",
    meaning: "火曜日",
    hoursAgo: 24 * 10 + 5,
  },
  {
    id: "seed-d10-2",
    who: "me",
    lang: "ja",
    targetText: "学校に行く",
    meaning: "학교에 가다",
    furigana: [
      { base: "学", ruby: "がっ" },
      { base: "校", ruby: "こう" },
      { base: "に", ruby: null },
      { base: "行", ruby: "い" },
      { base: "く", ruby: null },
    ],
    hoursAgo: 24 * 10 + 10,
    confirmed: true,
  },

  // ── 14일 전
  {
    id: "seed-d14-1",
    who: "me",
    lang: "ja",
    targetText: "買い物",
    meaning: "장보기",
    furigana: [
      { base: "買", ruby: "か" },
      { base: "い", ruby: null },
      { base: "物", ruby: "もの" },
    ],
    hoursAgo: 24 * 14 + 1,
  },
  {
    id: "seed-d14-2",
    who: "partner",
    lang: "ko",
    targetText: "괜찮아요",
    meaning: "大丈夫です",
    hoursAgo: 24 * 14 + 12,
    confirmed: true,
  },

  // ── 20일 전
  {
    id: "seed-d20-1",
    who: "me",
    lang: "ja",
    targetText: "友達",
    meaning: "친구",
    furigana: [
      { base: "友", ruby: "とも" },
      { base: "達", ruby: "だち" },
    ],
    hoursAgo: 24 * 20 + 4,
    confirmed: true,
  },
  {
    id: "seed-d20-2",
    who: "partner",
    lang: "ko",
    targetText: "도와주세요",
    meaning: "助けてください",
    note: "정중하게 부탁할 때",
    hoursAgo: 24 * 20 + 18,
    confirmed: true,
  },

  // ── 25일 전
  {
    id: "seed-d25-1",
    who: "me",
    lang: "ja",
    targetText: "今日は天気がいいから公園で散歩しましょう",
    meaning: "오늘은 날씨가 좋으니까 공원에서 산책해요",
    furigana: [
      { base: "今日", ruby: "きょう" },
      { base: "は", ruby: null },
      { base: "天", ruby: "てん" },
      { base: "気", ruby: "き" },
      { base: "がいいから", ruby: null },
      { base: "公", ruby: "こう" },
      { base: "園", ruby: "えん" },
      { base: "で", ruby: null },
      { base: "散", ruby: "さん" },
      { base: "歩", ruby: "ぽ" },
      { base: "しましょう", ruby: null },
    ],
    note: "숙자훈(今日) + 연탁(歩→ぽ) 케이스",
    hoursAgo: 24 * 25 + 3,
    confirmed: true,
  },
  {
    id: "seed-d25-2",
    who: "partner",
    lang: "ko",
    targetText: "비가 올 것 같아요",
    meaning: "雨が降りそうです",
    note: "「-(으)ㄹ 것 같다」는 추측",
    hoursAgo: 24 * 25 + 14,
  },

  // ── 30일 전
  {
    id: "seed-d30-1",
    who: "me",
    lang: "ja",
    targetText: "お元気ですか",
    meaning: "잘 지내세요?",
    furigana: [
      { base: "お", ruby: null },
      { base: "元", ruby: "げん" },
      { base: "気", ruby: "き" },
      { base: "ですか", ruby: null },
    ],
    hoursAgo: 24 * 30 + 6,
    confirmed: true,
  },
  {
    id: "seed-d30-2",
    who: "partner",
    lang: "ko",
    targetText: "처음 뵙겠습니다",
    meaning: "はじめまして",
    note: "첫 인사 — 격식 있는 표현",
    hoursAgo: 24 * 30 + 20,
    confirmed: true,
  },
];

/**
 * 가상화/스크롤 테스트용 벌크 시드 — 90일 분포 100건 가까이.
 * 결정적 id (seed-bulk-N)로 idempotent.
 */
const BULK_VOCAB: { lang: "ko" | "ja"; target: string; meaning: string }[] = [
  { lang: "ja", target: "学校", meaning: "학교" },
  { lang: "ja", target: "電車", meaning: "전철" },
  { lang: "ja", target: "図書館", meaning: "도서관" },
  { lang: "ja", target: "新しい", meaning: "새롭다" },
  { lang: "ja", target: "難しい", meaning: "어렵다" },
  { lang: "ja", target: "面白い", meaning: "재미있다" },
  { lang: "ja", target: "始める", meaning: "시작하다" },
  { lang: "ja", target: "終わる", meaning: "끝나다" },
  { lang: "ja", target: "話す", meaning: "이야기하다" },
  { lang: "ja", target: "聞く", meaning: "듣다" },
  { lang: "ja", target: "見る", meaning: "보다" },
  { lang: "ja", target: "食べる", meaning: "먹다" },
  { lang: "ja", target: "飲む", meaning: "마시다" },
  { lang: "ja", target: "走る", meaning: "달리다" },
  { lang: "ja", target: "歩く", meaning: "걷다" },
  { lang: "ja", target: "考える", meaning: "생각하다" },
  { lang: "ja", target: "覚える", meaning: "외우다" },
  { lang: "ja", target: "忘れる", meaning: "잊다" },
  { lang: "ja", target: "教える", meaning: "가르치다" },
  { lang: "ja", target: "習う", meaning: "배우다" },
  { lang: "ko", target: "회사", meaning: "会社" },
  { lang: "ko", target: "학교", meaning: "学校" },
  { lang: "ko", target: "친구", meaning: "友達" },
  { lang: "ko", target: "가족", meaning: "家族" },
  { lang: "ko", target: "여행", meaning: "旅行" },
  { lang: "ko", target: "음악", meaning: "音楽" },
  { lang: "ko", target: "영화", meaning: "映画" },
  { lang: "ko", target: "책", meaning: "本" },
  { lang: "ko", target: "쉽다", meaning: "簡単だ" },
  { lang: "ko", target: "어렵다", meaning: "難しい" },
  { lang: "ko", target: "재미있다", meaning: "面白い" },
  { lang: "ko", target: "좋아하다", meaning: "好きだ" },
  { lang: "ko", target: "싫어하다", meaning: "嫌いだ" },
  { lang: "ko", target: "기다리다", meaning: "待つ" },
  { lang: "ko", target: "만나다", meaning: "会う" },
  { lang: "ko", target: "이야기하다", meaning: "話す" },
];

function buildBulkSeeds(): SeedCard[] {
  const out: SeedCard[] = [];
  // 90일 안에 70건 — 거의 매일 1개씩
  const N = 70;
  for (let i = 0; i < N; i++) {
    const v = BULK_VOCAB[i % BULK_VOCAB.length]!;
    // 결정적이지만 분포가 고르게 — i 기반으로 hoursAgo 계산
    const dayOffset = Math.floor((i / N) * 88) + 1; // 1~88일 전
    const hourOfDay = (i * 37) % 24;
    const hoursAgo = dayOffset * 24 + hourOfDay;
    out.push({
      id: `seed-bulk-${i}`,
      who: i % 2 === 0 ? "me" : "partner",
      lang: v.lang,
      targetText: v.target,
      meaning: v.meaning,
      hoursAgo,
      confirmed: i % 3 !== 0, // 2/3 정도 확인됨
    });
  }
  return out;
}

function seedTestCards() {
  const db = getDb();
  const owners = [...ownerEmails];
  const meEmail = owners[0];
  const partnerEmail = owners[1];
  if (!meEmail || !partnerEmail) return;

  const me = db.select().from(users).where(eq(users.email, meEmail)).get();
  const partner = db
    .select()
    .from(users)
    .where(eq(users.email, partnerEmail))
    .get();
  if (!me || !partner) return;

  const now = Date.now();
  let inserted = 0;

  const allSeeds = [...SEEDS, ...buildBulkSeeds()];
  for (const seed of allSeeds) {
    const exists = db.select().from(cards).where(eq(cards.id, seed.id)).get();
    if (exists) continue;

    const author = seed.who === "me" ? me : partner;
    const confirmer = seed.who === "me" ? partner : me;
    const ts = now - seed.hoursAgo * HOUR;

    db.insert(cards)
      .values({
        id: seed.id,
        authorId: author.id,
        lang: seed.lang,
        targetText: seed.targetText,
        meaning: seed.meaning,
        example: seed.example ?? null,
        note: seed.note ?? null,
        tags: null,
        furigana: seed.furigana ? JSON.stringify(seed.furigana) : null,
        confirmedAt: seed.confirmed ? ts + HOUR : null,
        confirmedBy: seed.confirmed ? confirmer.id : null,
        createdAt: ts,
        // updatedAt = now → 기존 클라가 incremental sync로도 새 시드를 받아옴
        updatedAt: now,
      })
      .run();
    inserted++;
  }

  if (inserted > 0) console.log(`[api] seeded ${inserted} test cards`);
}

bootstrap();

const app = new Hono();

app.use("*", logger());
app.use(
  "*",
  cors({
    origin: [env.WEB_ORIGIN],
    credentials: true,
  }),
);

app.get("/", (c) => c.json({ name: "dorandoran-api", ok: true }));
app.get("/health", (c) => c.json({ ok: true, ts: Date.now() }));

app.route("/auth", authRoutes);
app.route("/cards", cardRoutes);
app.route("/sync", syncRoutes);
app.route("/review", reviewRoutes);
app.route("/push", pushRoutes);

app.onError((err, c) => {
  console.error("[api] unhandled", err);
  return c.json({ error: "internal_error" }, 500);
});

serve({ fetch: app.fetch, port: env.PORT }, (info) => {
  console.log(`도란도란 API listening on http://localhost:${info.port}`);
});

export type AppType = typeof app;
