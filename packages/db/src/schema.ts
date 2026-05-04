import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  uniqueIndex,
  index,
} from "drizzle-orm/sqlite-core";
import { relations, sql } from "drizzle-orm";

const now = () => sql`(unixepoch() * 1000)`;

/**
 * 도란도란 DB 스키마.
 *
 * 동기 가능한 모든 엔티티는 다음 3 컬럼을 공통으로 가진다:
 *   - createdAt   : 생성 시각 (ms)
 *   - updatedAt   : 마지막 변경 시각 (ms) — sync since 비교 기준
 *   - deletedAt   : null이면 정상, 값 있으면 소프트 삭제 (톰스톤)
 *
 * 클라이언트는 GET /sync?since=T 로 updatedAt > T 인 모든 엔티티를 받음.
 * deletedAt 있으면 로컬에서 제거, 없으면 upsert.
 *
 * magic_links는 동기 대상 아님 (서버 전용).
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  displayName: text("display_name").notNull(),
  nativeLang: text("native_lang", { enum: ["ko", "ja"] }).notNull(),
  learningLang: text("learning_lang", { enum: ["ko", "ja"] }).notNull(),
  avatarUrl: text("avatar_url"),
  pushSubscription: text("push_subscription"),
  createdAt: integer("created_at").notNull().default(now()),
  updatedAt: integer("updated_at").notNull().default(now()),
  deletedAt: integer("deleted_at"),
});

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
    audioS3Key: text("audio_s3_key"),
    tags: text("tags"), // JSON array
    /** FuriganaPart[] JSON */
    furigana: text("furigana"),
    /** 원어민 확인 시각. null이면 대기. */
    confirmedAt: integer("confirmed_at"),
    confirmedBy: text("confirmed_by").references(() => users.id, {
      onDelete: "set null",
    }),
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

export const comments = sqliteTable(
  "comments",
  {
    id: text("id").primaryKey(),
    cardId: text("card_id")
      .notNull()
      .references(() => cards.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    audioS3Key: text("audio_s3_key"),
    createdAt: integer("created_at").notNull().default(now()),
    updatedAt: integer("updated_at").notNull().default(now()),
    deletedAt: integer("deleted_at"),
  },
  (t) => ({
    byCard: index("comments_card_idx").on(t.cardId),
    byUpdated: index("comments_updated_idx").on(t.updatedAt),
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

export const magicLinks = sqliteTable("magic_links", {
  token: text("token").primaryKey(),
  email: text("email").notNull(),
  expiresAt: integer("expires_at").notNull(),
  consumedAt: integer("consumed_at"),
  createdAt: integer("created_at").notNull().default(now()),
});

// ─── Relations ────────────────────────────────────────
export const usersRelations = relations(users, ({ many }) => ({
  cards: many(cards),
  comments: many(comments),
  reviewStates: many(reviewStates),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  author: one(users, { fields: [cards.authorId], references: [users.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  card: one(cards, { fields: [comments.cardId], references: [cards.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

// ─── Inferred types ───────────────────────────────────
export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;
export type DbCard = typeof cards.$inferSelect;
export type DbCardInsert = typeof cards.$inferInsert;
export type DbComment = typeof comments.$inferSelect;
export type DbCommentInsert = typeof comments.$inferInsert;
export type DbReviewState = typeof reviewStates.$inferSelect;
export type DbMagicLink = typeof magicLinks.$inferSelect;
