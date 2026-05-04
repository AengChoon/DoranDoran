import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { reviewSubmitSchema } from "@dorandoran/shared";
import { authMiddleware } from "../auth.js";

export const reviewRoutes = new Hono()
  .use("*", authMiddleware)

  .get("/queue", async (c) => {
    return c.json({ items: [], todo: "due cards by SM-2" });
  })

  .post("/:cardId", zValidator("json", reviewSubmitSchema), async (c) => {
    return c.json({ ok: true, todo: "apply SM-2 update" });
  });
