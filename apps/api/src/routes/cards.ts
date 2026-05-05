import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, lt, sql, inArray, isNull, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  cardCreateSchema,
  cardUpdateSchema,
  commentCreateSchema,
  type FuriganaPart,
} from "@dorandoran/shared";
import { cards, comments } from "@dorandoran/db";
import { authMiddleware, getSession } from "../auth";
import { getDb } from "../db";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseFurigana(raw: string | null): FuriganaPart[] | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed as FuriganaPart[];
  } catch {
    return null;
  }
}

export const cardRoutes = new Hono()
  .use("*", authMiddleware)

  // 리스트 (페이징) — 삭제되지 않은 카드만
  .get("/", async (c) => {
    const limitRaw = Number(c.req.query("limit") ?? DEFAULT_LIMIT);
    const limit = Math.min(Math.max(1, limitRaw), MAX_LIMIT);
    const cursorRaw = c.req.query("cursor");
    const cursor = cursorRaw ? Number(cursorRaw) : null;

    const db = getDb();

    const where = cursor
      ? and(isNull(cards.deletedAt), lt(cards.createdAt, cursor))
      : isNull(cards.deletedAt);

    const rows = db
      .select()
      .from(cards)
      .where(where)
      .orderBy(desc(cards.createdAt))
      .limit(limit + 1)
      .all();

    const hasMore = rows.length > limit;
    const items = hasMore ? rows.slice(0, limit) : rows;
    const last = items[items.length - 1];
    const nextCursor = hasMore && last ? String(last.createdAt) : null;

    const ids = items.map((r) => r.id);
    const counts =
      ids.length > 0
        ? db
            .select({
              cardId: comments.cardId,
              count: sql<number>`count(*)`.as("count"),
            })
            .from(comments)
            .where(and(inArray(comments.cardId, ids), isNull(comments.deletedAt)))
            .groupBy(comments.cardId)
            .all()
        : [];
    const countMap = new Map(counts.map((c) => [c.cardId, Number(c.count)]));

    return c.json({
      items: items.map((row) => ({
        id: row.id,
        authorId: row.authorId,
        lang: row.lang,
        targetText: row.targetText,
        meaning: row.meaning,
        example: row.example,
        note: row.note,
        tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
        furigana: parseFurigana(row.furigana),
        confirmedAt: row.confirmedAt,
        confirmedBy: row.confirmedBy,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
        commentCount: countMap.get(row.id) ?? 0,
      })),
      nextCursor,
    });
  })

  // 생성
  .post("/", zValidator("json", cardCreateSchema), async (c) => {
    const session = getSession(c);
    const input = c.req.valid("json");
    const db = getDb();

    const id = nanoid();
    const now = Date.now();

    db.insert(cards)
      .values({
        id,
        authorId: session.userId,
        lang: input.lang,
        targetText: input.targetText,
        meaning: input.meaning,
        example: input.example ?? null,
        note: input.note ?? null,
        tags: input.tags ? JSON.stringify(input.tags) : null,
        furigana:
          input.lang === "ja" && input.furigana && input.furigana.length > 0
            ? JSON.stringify(input.furigana)
            : null,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    const row = db.select().from(cards).where(eq(cards.id, id)).get();
    return c.json({ card: row }, 201);
  })

  // 단건 조회
  .get("/:id", async (c) => {
    const id = c.req.param("id");
    const db = getDb();
    const row = db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .get();
    if (!row) return c.json({ error: "not_found" }, 404);

    const commentCountRow = db
      .select({ count: sql<number>`count(*)`.as("count") })
      .from(comments)
      .where(and(eq(comments.cardId, id), isNull(comments.deletedAt)))
      .get();

    return c.json({
      card: {
        ...row,
        tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
        furigana: parseFurigana(row.furigana),
        commentCount: Number(commentCountRow?.count ?? 0),
      },
    });
  })

  // 수정
  .patch("/:id", zValidator("json", cardUpdateSchema), async (c) => {
    const session = getSession(c);
    const id = c.req.param("id");
    const input = c.req.valid("json");
    const db = getDb();

    const existing = db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .get();
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (existing.authorId !== session.userId)
      return c.json({ error: "forbidden" }, 403);

    const finalLang = input.lang ?? existing.lang;

    db.update(cards)
      .set({
        ...(input.lang !== undefined ? { lang: input.lang } : {}),
        ...(input.targetText !== undefined
          ? { targetText: input.targetText }
          : {}),
        ...(input.meaning !== undefined ? { meaning: input.meaning } : {}),
        ...(input.example !== undefined
          ? { example: input.example ?? null }
          : {}),
        ...(input.note !== undefined ? { note: input.note ?? null } : {}),
        ...(input.tags !== undefined
          ? { tags: input.tags ? JSON.stringify(input.tags) : null }
          : {}),
        ...(input.furigana !== undefined
          ? {
              furigana:
                finalLang === "ja" &&
                input.furigana &&
                input.furigana.length > 0
                  ? JSON.stringify(input.furigana)
                  : null,
            }
          : {}),
        updatedAt: Date.now(),
      })
      .where(eq(cards.id, id))
      .run();

    return c.json({ ok: true });
  })

  // 소프트 삭제
  .delete("/:id", async (c) => {
    const session = getSession(c);
    const id = c.req.param("id");
    const db = getDb();

    const existing = db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .get();
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (existing.authorId !== session.userId)
      return c.json({ error: "forbidden" }, 403);

    const now = Date.now();
    db.update(cards)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(cards.id, id))
      .run();

    return c.json({ ok: true });
  })

  // 원어민 확인
  .post("/:id/confirm", async (c) => {
    const session = getSession(c);
    const id = c.req.param("id");
    const db = getDb();

    const existing = db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .get();
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (existing.authorId === session.userId)
      return c.json({ error: "cannot_confirm_own_card" }, 400);

    const now = Date.now();
    db.update(cards)
      .set({ confirmedAt: now, confirmedBy: session.userId, updatedAt: now })
      .where(eq(cards.id, id))
      .run();

    return c.json({ ok: true });
  })

  // 확인 취소
  .delete("/:id/confirm", async (c) => {
    const session = getSession(c);
    const id = c.req.param("id");
    const db = getDb();

    const existing = db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .get();
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (existing.confirmedBy !== session.userId)
      return c.json({ error: "forbidden" }, 403);

    db.update(cards)
      .set({ confirmedAt: null, confirmedBy: null, updatedAt: Date.now() })
      .where(eq(cards.id, id))
      .run();

    return c.json({ ok: true });
  })

  .post("/:id/audio-upload-url", async (c) => {
    return c.json({ todo: "presigned URL", url: null, key: null });
  })

  // 댓글 생성
  .post("/:id/comments", zValidator("json", commentCreateSchema), async (c) => {
    const session = getSession(c);
    const cardId = c.req.param("id");
    const input = c.req.valid("json");
    const db = getDb();

    const card = db
      .select()
      .from(cards)
      .where(and(eq(cards.id, cardId), isNull(cards.deletedAt)))
      .get();
    if (!card) return c.json({ error: "not_found" }, 404);

    const id = nanoid();
    const now = Date.now();
    db.insert(comments)
      .values({
        id,
        cardId,
        authorId: session.userId,
        body: input.body,
        createdAt: now,
        updatedAt: now,
      })
      .run();

    // 카드의 updatedAt도 갱신 — 댓글 추가도 카드 변경으로 간주 (sync 트리거)
    db.update(cards).set({ updatedAt: now }).where(eq(cards.id, cardId)).run();

    const row = db.select().from(comments).where(eq(comments.id, id)).get();
    return c.json({ comment: row }, 201);
  })

  // 댓글 삭제 (소프트)
  .delete("/:id/comments/:commentId", async (c) => {
    const session = getSession(c);
    const commentId = c.req.param("commentId");
    const db = getDb();

    const existing = db
      .select()
      .from(comments)
      .where(and(eq(comments.id, commentId), isNull(comments.deletedAt)))
      .get();
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (existing.authorId !== session.userId)
      return c.json({ error: "forbidden" }, 403);

    const now = Date.now();
    db.update(comments)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(comments.id, commentId))
      .run();

    return c.json({ ok: true });
  });
