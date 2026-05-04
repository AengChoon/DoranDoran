import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { pushSubscribeSchema } from "@dorandoran/shared";
import { authMiddleware } from "../auth.js";

export const pushRoutes = new Hono()
  .use("*", authMiddleware)

  .post("/subscribe", zValidator("json", pushSubscribeSchema), async (c) => {
    return c.json({ ok: true, todo: "save push subscription" });
  })

  .post("/test", async (c) => {
    return c.json({ ok: true, todo: "send test push" });
  });
