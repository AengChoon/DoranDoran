import { Hono } from "hono";
import { gt } from "drizzle-orm";
import type {
  Card,
  Comment,
  FuriganaPart,
  SyncResponse,
  UserPublic,
} from "@dorandoran/shared";
import { cards, comments, users } from "@dorandoran/db";
import { authMiddleware } from "../auth";
import { getDb } from "../db";

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

/**
 * 델타 싱크 엔드포인트.
 *
 * GET /sync?since=<ms>
 *   - since=0 또는 미지정: 모든 비삭제 엔티티 (첫 동기화)
 *   - since=T (>0): updatedAt > T 인 모든 엔티티 (deletedAt 포함 — 톰스톤도 전달)
 *
 * 응답:
 *   { cards, comments, users, serverTime }
 *
 * 클라이언트 처리:
 *   - deletedAt 있음 → 로컬에서 제거
 *   - 없음 → upsert
 *   - 다음 sync 시 since = serverTime
 */
export const syncRoutes = new Hono()
  .use("*", authMiddleware)

  .get("/", async (c) => {
    const sinceRaw = c.req.query("since");
    const since = sinceRaw ? Math.max(0, Number(sinceRaw)) : 0;
    const db = getDb();
    const serverTime = Date.now();

    // 첫 동기화면 비삭제만, 그 이후엔 변경된 모든 행(톰스톤 포함)
    const cardRows =
      since === 0
        ? db.select().from(cards).where(gt(cards.updatedAt, 0)).all()
        : db.select().from(cards).where(gt(cards.updatedAt, since)).all();

    const commentRows =
      since === 0
        ? db.select().from(comments).where(gt(comments.updatedAt, 0)).all()
        : db.select().from(comments).where(gt(comments.updatedAt, since)).all();

    const userRows =
      since === 0
        ? db.select().from(users).where(gt(users.updatedAt, 0)).all()
        : db.select().from(users).where(gt(users.updatedAt, since)).all();

    const cardItems: Card[] = cardRows.map((row) => ({
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
    }));

    const commentItems: Comment[] = commentRows.map((row) => ({
      id: row.id,
      cardId: row.cardId,
      authorId: row.authorId,
      body: row.body,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    }));

    const userItems: UserPublic[] = userRows.map((row) => ({
      id: row.id,
      email: row.email,
      displayName: row.displayName,
      nativeLang: row.nativeLang,
      learningLang: row.learningLang,
      avatarUrl: row.avatarUrl,
      onboardedAt: row.onboardedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      deletedAt: row.deletedAt,
    }));

    const payload: SyncResponse = {
      cards: cardItems,
      comments: commentItems,
      users: userItems,
      serverTime,
    };

    return c.json(payload);
  });
