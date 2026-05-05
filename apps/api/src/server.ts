import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { env } from "./env";
import { getDb } from "./db";
import { authRoutes } from "./routes/auth";
import { cardRoutes } from "./routes/cards";
import { reviewRoutes } from "./routes/review";
import { pushRoutes } from "./routes/push";
import { syncRoutes } from "./routes/sync";

// 부팅 시 DB 스키마 초기화 (idempotent CREATE TABLE IF NOT EXISTS)
getDb();

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
