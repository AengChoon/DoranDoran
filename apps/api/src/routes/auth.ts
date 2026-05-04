import { Hono } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";
import { eq } from "drizzle-orm";
import { nanoid } from "nanoid";
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

    const link = `${env.WEB_ORIGIN}/api/auth/verify?token=${token}`;

    // SES 대신 콘솔에 출력 — 복사·붙여넣기로 로그인
    console.log("\n──────────────────────────────────────");
    console.log(`📬  도란도란 매직링크 (${email})`);
    console.log(`    유효시간: 15분`);
    console.log(`    링크: ${link}`);
    console.log("──────────────────────────────────────\n");

    return c.json({ ok: true });
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

    // 사용자 조회 또는 생성
    let user = db.select().from(users).where(eq(users.email, row.email)).get();
    if (!user) {
      const id = nanoid();
      // 첫 로그인하는 사람의 학습 언어는 환경변수 순서로 결정 — 첫 번째 이메일은 한국인(일본어 학습), 두 번째는 일본인(한국어 학습)
      const ownerList = [...ownerEmails];
      const isFirst = ownerList[0] === row.email;
      db.insert(users)
        .values({
          id,
          email: row.email,
          displayName: isFirst ? "나" : "파트너",
          nativeLang: isFirst ? "ko" : "ja",
          learningLang: isFirst ? "ja" : "ko",
        })
        .run();
      user = db.select().from(users).where(eq(users.email, row.email)).get()!;
    }

    const jwt = await signSession({ userId: user.id, email: user.email });
    setCookie(c, sessionCookie.name, jwt, sessionCookie.options);

    // 웹 도메인의 /feed로 리다이렉트 (Next rewrites 통해서 들어왔으면 상대경로면 충분)
    return c.redirect("/feed");
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
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
      deletedAt: u.deletedAt,
    });

    return c.json({
      user: toPublic(me),
      partner: partner ? toPublic(partner) : null,
    });
  });
