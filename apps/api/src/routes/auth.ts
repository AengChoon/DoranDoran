import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { magicLinkRequestSchema } from "@dorandoran/shared";
import { magicLinks, users } from "@dorandoran/db";
import { env, ownerEmails } from "../env";
import { getDb } from "../db";
import {
  sessionCookie,
  signSession,
  authMiddleware,
  getSession,
} from "../auth";
import { sendMagicLinkEmail } from "../mailer";
import { uploadAvatar, deleteAvatarByUrl, AvatarUploadError } from "../storage/avatars";

const profileUpdateSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  nativeLang: z.enum(["ko", "ja"]),
  learningLang: z.enum(["ko", "ja"]),
});

const TOKEN_TTL_MS = 15 * 60 * 1000;

export const authRoutes = new Hono()
  .post("/magic-link", zValidator("json", magicLinkRequestSchema), async (c) => {
    const { email } = c.req.valid("json");

    // 화이트리스트 외 이메일이어도 200 — 존재 여부 노출하지 않음
    if (!ownerEmails.has(email)) {
      console.log(`[auth] magic-link: ignored non-owner ${email}`);
      return c.json({ ok: true });
    }

    const db = getDb();
    const token = nanoid(40);
    const now = Date.now();

    db.insert(magicLinks)
      .values({
        token,
        email,
        expiresAt: now + TOKEN_TTL_MS,
      })
      .run();

    const link = `${env.API_ORIGIN}/auth/verify?token=${token}`;

    try {
      await sendMagicLinkEmail(email, link);
    } catch (err) {
      // 메일 발송 실패해도 클라이언트엔 200 — 이메일 존재 여부 노출 방지
      // 토큰은 DB에 살아있으니 재시도 시 동일 시점에 새 토큰 발급
      console.error(`[auth] magic-link send failed for ${email}:`, err);
    }

    // dev 모드 — 응답에 link 직접 포함해 메일 안 받고도 즉시 로그인 가능
    // prod (NODE_ENV=production)에선 절대 노출 X
    const isDev = process.env.NODE_ENV !== "production";
    return c.json(isDev ? { ok: true, devLink: link } : { ok: true });
  })

  .get("/verify", async (c) => {
    const token = c.req.query("token");
    if (!token) return c.text("missing token", 400);

    const db = getDb();
    const now = Date.now();

    const row = db
      .select()
      .from(magicLinks)
      .where(eq(magicLinks.token, token))
      .get();

    if (!row) return c.text("invalid token", 400);
    if (row.consumedAt !== null) return c.text("token already used", 400);
    if (row.expiresAt < now) return c.text("token expired", 400);

    if (!ownerEmails.has(row.email)) return c.text("not authorized", 403);

    // 토큰 소비 처리
    db.update(magicLinks)
      .set({ consumedAt: now })
      .where(eq(magicLinks.token, token))
      .run();

    // 사용자 조회 또는 생성 — onboarding 전엔 임시 displayName(이메일 prefix)/언어 default.
    // 실제 본인 정보는 /onboarding 화면에서 PATCH /auth/me로 채움 (onboardedAt도 그때 설정).
    let user = db.select().from(users).where(eq(users.email, row.email)).get();
    if (!user) {
      const id = nanoid();
      const tempName = row.email.split("@")[0] ?? "user";
      db.insert(users)
        .values({
          id,
          email: row.email,
          displayName: tempName,
          nativeLang: "ko",
          learningLang: "ja",
          // onboardedAt = null — AuthGuard가 /onboarding으로 보냄
        })
        .run();
      user = db.select().from(users).where(eq(users.email, row.email)).get()!;
    }

    const jwt = await signSession({ userId: user.id, email: user.email });
    setCookie(c, sessionCookie.name, jwt, sessionCookie.options);

    // 웹 도메인 절대 경로로 리다이렉트 — API/web이 다른 origin이므로 상대경로 X
    return c.redirect(`${env.WEB_ORIGIN}/feed`);
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
