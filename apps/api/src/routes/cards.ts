import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { eq, desc, lt, isNull, and } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  cardCreateSchema,
  cardUpdateSchema,
  cardConfirmSchema,
  type Correction,
  type FuriganaPart,
} from "@dorandoran/shared";
import { cards } from "@dorandoran/db";
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

function parseCorrection(raw: string | null): Correction | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return parsed as Correction;
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
        correction: parseCorrection(row.correction),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        deletedAt: row.deletedAt,
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

    return c.json({
      card: {
        ...row,
        tags: row.tags ? (JSON.parse(row.tags) as string[]) : [],
        furigana: parseFurigana(row.furigana),
        correction: parseCorrection(row.correction),
      },
    });
  })

  // 수정 — author 본인만. 원본 수정 시 옛 첨삭이 새 원본과 어긋날 수 있어
  // confirmed_at, confirmed_by, correction 모두 자동 무효화 → 대기 상태로 복귀.
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
        // 첨삭 자동 무효화
        confirmedAt: null,
        confirmedBy: null,
        correction: null,
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

  // 원어민 확인 (+ 선택적 첨삭). body의 correction이 있으면 같이 저장.
  // 비어있거나 빈 객체면 "그대로 OK".
  .post("/:id/confirm", zValidator("json", cardConfirmSchema), async (c) => {
    const session = getSession(c);
    const id = c.req.param("id");
    const { correction } = c.req.valid("json");
    const db = getDb();

    const existing = db
      .select()
      .from(cards)
      .where(and(eq(cards.id, id), isNull(cards.deletedAt)))
      .get();
    if (!existing) return c.json({ error: "not_found" }, 404);
    if (existing.authorId === session.userId)
      return c.json({ error: "cannot_confirm_own_card" }, 400);

    // 빈 객체는 null로 저장 (모든 필드가 비어있으면 의미 없음)
    const hasAnyField =
      correction != null &&
      (correction.target ||
        correction.meaning ||
        correction.example ||
        correction.note);
    const correctionJson = hasAnyField ? JSON.stringify(correction) : null;

    const now = Date.now();
    db.update(cards)
      .set({
        confirmedAt: now,
        confirmedBy: session.userId,
        correction: correctionJson,
        updatedAt: now,
      })
      .where(eq(cards.id, id))
      .run();

    return c.json({ ok: true });
  })

  // 확인 취소 — 첨삭자 본인만. confirmed_at/confirmed_by/correction 모두 클리어.
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
      .set({
        confirmedAt: null,
        confirmedBy: null,
        correction: null,
        updatedAt: Date.now(),
      })
      .where(eq(cards.id, id))
      .run();

    return c.json({ ok: true });
  });
