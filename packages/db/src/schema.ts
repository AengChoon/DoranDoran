import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

const now = () => sql`(unixepoch() * 1000)`;

/**
 * 도란도란 DB 스키마.
 *
 * 동기 가능한 모든 엔티티는 createdAt/updatedAt/deletedAt 트리오를 가짐.
 * deletedAt이 있으면 톰스톤(소프트 삭제) — 클라이언트는 로컬에서 제거.
 *
 * GET /sync?since=T 로 updatedAt > T 인 모든 엔티티를 받아옴.
 *   - deletedAt 있음 → 로컬에서 제거
 *   - 없음 → upsert
 *
 * pinCodes는 sync 대상 아님 (서버 전용).
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  nativeLang: text("native_lang", { enum: ["ko", "ja"] }).notNull(),
  learningLang: text("learning_lang", { enum: ["ko", "ja"] }).notNull(),
  avatarUrl: text("avatar_url"),
  // 프로필 셋업 완료 시각 — null이면 /onboarding으로 강제 redirect
  onboardedAt: integer("onboarded_at"),
  createdAt: integer("created_at").notNull().default(now()),
  updatedAt: integer("updated_at").notNull().default(now()),
  deletedAt: integer("deleted_at"),
}, (t) => ({
  byUpdated: index("users_updated_idx").on(t.updatedAt),
}));

export const cards = sqliteTable(
  "cards",
  {
    id: text("id").primaryKey(),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lang: text("lang", { enum: ["ko", "ja"] }).notNull(),
    targetText: text("target_text").notNull(),
    meaning: text("meaning").notNull(),
    example: text("example"),
    note: text("note"),
    tags: text("tags"), // JSON array
    /** FuriganaPart[] JSON */
    furigana: text("furigana"),
    /** 원어민 확인 시각. null이면 대기. correction 유무와 무관 — confirmed면 ✓. */
    confirmedAt: integer("confirmed_at"),
    confirmedBy: text("confirmed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    /** 첨삭본 — JSON {target?, meaning?, example?, note?}, 각 필드 {text?, comment?, furigana?}. */
    correction: text("correction"),
    createdAt: integer("created_at").notNull().default(now()),
    updatedAt: integer("updated_at").notNull().default(now()),
    deletedAt: integer("deleted_at"),
  },
  (t) => ({
    byAuthor: index("cards_author_idx").on(t.authorId),
    byCreated: index("cards_created_idx").on(t.createdAt),
    byUpdated: index("cards_updated_idx").on(t.updatedAt),
  }),
);

export const reviewStates = sqliteTable(
  "review_states",
  {
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    easeFactor: real("ease_factor").notNull().default(2.5),
    intervalDays: integer("interval_days").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    nextReviewAt: integer("next_review_at").notNull(),
    lastReviewedAt: integer("last_reviewed_at"),
    createdAt: integer("created_at").notNull().default(now()),
    updatedAt: integer("updated_at").notNull().default(now()),
    deletedAt: integer("deleted_at"),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.cardId, t.userId] }),
    byNext: index("review_next_idx").on(t.userId, t.nextReviewAt),
    byUpdated: index("review_updated_idx").on(t.updatedAt),
  }),
);

/**
 * 로그인 PIN — 이메일로 6자리 코드 보내고 같은 브라우저에서 입력.
 *
 * 동일 email에 대해 새 PIN 발급 시 기존 unconsumed 행은 삭제 → 항상 1개만 유효.
 * brute-force 방어: attempts >= MAX_PIN_ATTEMPTS 면 소진 처리.
 */
export const pinCodes = sqliteTable("pin_codes", {
  code: text("code").primaryKey(),
  email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(),
  consumedAt: integer("consumed_at"),
  attempts: integer("attempts").notNull().default(0),
  createdAt: integer("created_at").notNull().default(now()),
}, (t) => ({
  byEmail: index("pin_codes_email_idx").on(t.email),
}));

// ─── Relations ────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  cards: many(cards),
  reviewStates: many(reviewStates),
}));

export const cardsRelations = relations(cards, ({ one }) => ({
  author: one(users, { fields: [cards.authorId], references: [users.id] }),
}));

// ─── Inferred types ───────────────────────────────────
export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;
export type DbCard = typeof cards.$inferSelect;
export type DbCardInsert = typeof cards.$inferInsert;
export type DbReviewState = typeof reviewStates.$inferSelect;
export type DbPinCode = typeof pinCodes.$inferSelect;
