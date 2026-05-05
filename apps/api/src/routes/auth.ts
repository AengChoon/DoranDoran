import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { and, desc, eq, isNull, gt } from "drizzle-orm";
import { nanoid } from "nanoid";
import { randomInt } from "node:crypto";
import { z } from "zod";
import {
  pinRequestSchema,
  pinVerifyRequestSchema,
} from "@dorandoran/shared";
import { pinCodes, users } from "@dorandoran/db";
import { env, ownerEmails } from "../env";
import { getDb } from "../db";
import {
  sessionCookie,
  signSession,
  authMiddleware,
  getSession,
} from "../auth";
import { sendPinEmail } from "../mailer";
import { uploadAvatar, deleteAvatarByUrl, AvatarUploadError } from "../storage/avatars";

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  nativeLang: z.enum(["ko", "ja"]),
  learningLang: z.enum(["ko", "ja"]),
});

const PIN_TTL_MS = 10 * 60 * 1000;
const MAX_PIN_ATTEMPTS = 5;

function generatePin(): string {
  // crypto.randomInt 0~999999 → 6자리 zero-pad
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

export const authRoutes = new Hono()
  .post("/request-pin", zValidator("json", pinRequestSchema), async (c) => {
    const { email } = c.req.valid("json");

    // 화이트리스트 외 이메일이어도 200 — 존재 여부 노출하지 않음
    if (!ownerEmails.has(email)) {
      console.log(`[auth] request-pin: ignored non-owner ${email}`);
      return c.json({ ok: true });
    }

    const db = getDb();
    const now = Date.now();

    // 동일 email의 미소비 PIN은 모두 무효화 — 항상 1개만 valid
    db.delete(pinCodes)
      .where(and(eq(pinCodes.email, email), isNull(pinCodes.consumedAt)))
      .run();

    // 1M 공간에서 동시 활성 PIN 극소 (whitelist 2명) → 충돌 거의 없지만
    // 안전하게 5회 재시도.
    let code = generatePin();
    let inserted = false;
    for (let i = 0; i < 5 && !inserted; i++) {
      try {
        db.insert(pinCodes)
          .values({
            code,
            email,
            expiresAt: now + PIN_TTL_MS,
          })
          .run();
        inserted = true;
      } catch {
        code = generatePin();
      }
    }
    if (!inserted) {
      console.error(`[auth] request-pin: PIN collision exhausted for ${email}`);
      return c.json({ ok: true });
    }

    try {
      await sendPinEmail(email, code);
    } catch (err) {
      console.error(`[auth] pin send failed for ${email}:`, err);
    }

    // dev 모드 — 응답에 code 포함해 메일 안 받고도 즉시 입력 가능
    const isDev = process.env.NODE_ENV !== "production";
    return c.json(isDev ? { ok: true, devCode: code } : { ok: true });
  })

  .post("/verify-pin", zValidator("json", pinVerifyRequestSchema), async (c) => {
    const { email, code } = c.req.valid("json");
    const db = getDb();
    const now = Date.now();

    // 화이트리스트 외 이메일도 같은 형태의 에러 — 이메일 존재 여부 노출 X
    if (!ownerEmails.has(email)) {
      return c.json({ error: "invalid code" }, 400);
    }

    // 해당 이메일의 가장 최근 미소비·미만료 PIN
    const row = db
      .select()
      .from(pinCodes)
      .where(
        and(
          eq(pinCodes.email, email),
          isNull(pinCodes.consumedAt),
          gt(pinCodes.expiresAt, now),
        ),
      )
      .orderBy(desc(pinCodes.createdAt))
      .get();

    if (!row) return c.json({ error: "invalid code" }, 400);

    // 시도 횟수 초과 — PIN 소진하고 거절
    if (row.attempts >= MAX_PIN_ATTEMPTS) {
      db.update(pinCodes)
        .set({ consumedAt: now })
        .where(eq(pinCodes.code, row.code))
        .run();
      return c.json({ error: "too many attempts" }, 400);
    }

    if (row.code !== code) {
      db.update(pinCodes)
        .set({ attempts: row.attempts + 1 })
        .where(eq(pinCodes.code, row.code))
        .run();
      return c.json({ error: "invalid code" }, 400);
    }

    // 성공 — PIN 소진 + 세션 발급
    db.update(pinCodes)
      .set({ consumedAt: now })
      .where(eq(pinCodes.code, row.code))
      .run();

    let user = db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      const id = nanoid();
      const tempName = email.split("@")[0] ?? "user";
      db.insert(users)
        .values({
          id,
          email,
          displayName: tempName,
          nativeLang: "ko",
          learningLang: "ja",
          // onboardedAt = null — AuthGuard가 /onboarding으로 보냄
        })
        .run();
      user = db.select().from(users).where(eq(users.email, email)).get()!;
    }

    const jwt = await signSession({ userId: user.id, email: user.email });
    setCookie(c, sessionCookie.name, jwt, sessionCookie.options);

    return c.json({ ok: true });
  })

  .post("/logout", async (c) => {
    deleteCookie(c, sessionCookie.name, { path: "/" });
    return c.json({ ok: true });
  })

  .get("/me", authMiddleware, async (c) => {
    const session = getSession(c);
    const db = getDb();
    const me = db.select().from(users).where(eq(users.id, session.userId)).get();
    if (!me) {
      // 쿠키가 가리키는 user가 사라짐 (DB 리셋 등) — 쿠키 클리어하고 401
      deleteCookie(c, sessionCookie.name, { path: "/" });
      return c.json({ error: "user not found" }, 401);
    }

    // 파트너 = 본인을 제외한 첫 사용자 (2인 화이트리스트 가정)
    const allUsers = db.select().from(users).all();
    const partner = allUsers.find((u) => u.id !== me.id) ?? null;

    const toPublic = (u: typeof me) => ({
      id: u.id,
      email: u.email,
      displayName: u.displayName,
      nativeLang: u.nativeLang,
      learningLang: u.learningLang,
      avatarUrl: u.avatarUrl,
      onboardedAt: u.onboardedAt,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      deletedAt: u.deletedAt,
    });

    return c.json({
      user: toPublic(me),
      partner: partner ? toPublic(partner) : null,
    });
  })

  .patch("/me", authMiddleware, zValidator("json", profileUpdateSchema), async (c) => {
    const session = getSession(c);
    const { displayName, nativeLang, learningLang } = c.req.valid("json");
    const db = getDb();
    const now = Date.now();

    db.update(users)
      .set({
        displayName,
        nativeLang,
        learningLang,
        onboardedAt: now,
        updatedAt: now,
      })
      .where(eq(users.id, session.userId))
      .run();

    return c.json({ ok: true });
  })

  .post("/me/avatar", authMiddleware, async (c) => {
    const session = getSession(c);
    const db = getDb();

    // multipart/form-data — file 필드명 "avatar"
    const body = await c.req.parseBody();
    const file = body["avatar"];
    if (!(file instanceof File)) {
      return c.json({ error: "missing 'avatar' file field" }, 400);
    }

    const buffer = new Uint8Array(await file.arrayBuffer());

    // 옛 아바타 URL 조회 (성공 후 삭제)
    const current = db
      .select({ avatarUrl: users.avatarUrl })
      .from(users)
      .where(eq(users.id, session.userId))
      .get();
    const oldUrl = current?.avatarUrl ?? null;

    let newUrl: string;
    try {
      newUrl = await uploadAvatar(session.userId, buffer, file.type);
    } catch (err) {
      if (err instanceof AvatarUploadError) {
        return c.json({ error: err.message }, 400);
      }
      console.error("[avatar] upload failed:", err);
      return c.json({ error: "upload failed" }, 500);
    }

    db.update(users)
      .set({ avatarUrl: newUrl, updatedAt: Date.now() })
      .where(eq(users.id, session.userId))
      .run();

    // 옛 파일 삭제 (best-effort, 실패해도 lifecycle이 정리)
    void deleteAvatarByUrl(oldUrl);

    return c.json({ ok: true, avatarUrl: newUrl });
  });
