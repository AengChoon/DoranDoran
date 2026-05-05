import { z } from "zod";

const schema = z.object({
  JWT_SECRET: z.string().min(16).default("dev-secret-change-me-please-please"),
  DB_PATH: z.string().default("./data/dorandoran.db"),
  S3_BUCKET: z.string().default("audio-bucket-placeholder"),
  AVATARS_S3_BUCKET: z.string().default("avatars-bucket-placeholder"),
  AWS_REGION: z.string().default("ap-northeast-2"),
  VAPID_PUBLIC_KEY: z.string().default(""),
  VAPID_PRIVATE_KEY: z.string().default(""),
  VAPID_SUBJECT: z.string().default("mailto:dev@example.com"),
  MAIL_FROM: z.string().default("no-reply@example.com"),
  OWNER_EMAILS: z.string().default(""),
  WEB_ORIGIN: z.string().default("http://localhost:3000"),
  API_ORIGIN: z.string().default("http://localhost:8787"),
  PORT: z.coerce.number().default(8787),
});

export const env = schema.parse(process.env);

export const ownerEmails = new Set(
  env.OWNER_EMAILS.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean),
);
