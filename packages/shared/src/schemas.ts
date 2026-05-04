import { z } from "zod";
import { LANGS, REACTION_EMOJIS } from "./constants";

export const langSchema = z.enum(LANGS);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "이메일 형식이 올바르지 않아요" });

export const magicLinkRequestSchema = z.object({
  email: emailSchema,
});

export const furiganaPartSchema = z.object({
  base: z.string().min(1).max(50),
  ruby: z.string().max(50).nullable(),
});

export const cardCreateSchema = z.object({
  lang: langSchema,
  targetText: z.string().min(1).max(500),
  meaning: z.string().min(1).max(500),
  example: z.string().max(1000).nullish(),
  note: z.string().max(2000).nullish(),
  tags: z.array(z.string().min(1).max(20)).max(10).nullish(),
  /** 일본어 후리가나 한자별 매핑. 다른 언어는 무시. */
  furigana: z.array(furiganaPartSchema).max(50).nullish(),
});

export const cardUpdateSchema = cardCreateSchema.partial();

export const commentCreateSchema = z.object({
  body: z.string().min(1).max(2000),
});

export const reactionCreateSchema = z.object({
  emoji: z.enum(REACTION_EMOJIS),
});

export const reviewSubmitSchema = z.object({
  quality: z.number().int().min(0).max(5),
});

export const pushSubscribeSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export type MagicLinkRequest = z.infer<typeof magicLinkRequestSchema>;
export type CardCreate = z.infer<typeof cardCreateSchema>;
export type CardUpdate = z.infer<typeof cardUpdateSchema>;
export type CommentCreate = z.infer<typeof commentCreateSchema>;
export type ReactionCreate = z.infer<typeof reactionCreateSchema>;
export type ReviewSubmit = z.infer<typeof reviewSubmitSchema>;
export type PushSubscription = z.infer<typeof pushSubscribeSchema>;
