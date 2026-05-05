import { z } from "zod";
import { LANGS } from "./constants";

export const langSchema = z.enum(LANGS);

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "이메일 형식이 올바르지 않아요" });

export const pinRequestSchema = z.object({
  email: emailSchema,
});

/** 6자리 숫자 PIN — 앞자리 0 허용. */
export const pinCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, { message: "6자리 숫자를 입력해주세요" });

export const pinVerifyRequestSchema = z.object({
  email: emailSchema,
  code: pinCodeSchema,
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

/** 한 필드 첨삭 — text/comment 모두 옵션, 둘 다 비면 키 자체가 없어야 함. */
const correctionFieldSchema = z
  .object({
    text: z.string().min(1).max(2000).optional(),
    comment: z.string().min(1).max(2000).optional(),
    furigana: z.array(furiganaPartSchema).max(50).nullish(),
  })
  .refine(
    (v) => v.text != null || v.comment != null,
    { message: "필드 첨삭은 text 또는 comment 중 하나는 있어야 해요" },
  );

export const correctionSchema = z.object({
  target: correctionFieldSchema.optional(),
  meaning: correctionFieldSchema.optional(),
  example: correctionFieldSchema.optional(),
  note: correctionFieldSchema.optional(),
});

/** POST /cards/:id/confirm 본문 — correction이 비어있거나 없으면 "그대로 OK". */
export const cardConfirmSchema = z.object({
  correction: correctionSchema.optional(),
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

export type PinRequest = z.infer<typeof pinRequestSchema>;
export type PinVerifyRequest = z.infer<typeof pinVerifyRequestSchema>;
export type CardCreate = z.infer<typeof cardCreateSchema>;
export type CardUpdate = z.infer<typeof cardUpdateSchema>;
export type CardConfirm = z.infer<typeof cardConfirmSchema>;
export type ReviewSubmit = z.infer<typeof reviewSubmitSchema>;
export type PushSubscription = z.infer<typeof pushSubscribeSchema>;
