import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { env } from "../env";

const s3 = new S3Client({ region: env.AWS_REGION });

const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 1 * 1024 * 1024; // 1MB

export class AvatarUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AvatarUploadError";
  }
}

/**
 * S3에 아바타 업로드 후 public URL 반환.
 * 키 형식: avatars/<userId>/<timestamp>.<ext> — 매번 새 path라서 CloudFront 캐시 자연스럽게 우회.
 */
export async function uploadAvatar(
  userId: string,
  data: Uint8Array,
  contentType: string,
): Promise<string> {
  if (!ALLOWED_MIME.has(contentType)) {
    throw new AvatarUploadError(`unsupported content-type: ${contentType}`);
  }
  if (data.byteLength > MAX_BYTES) {
    throw new AvatarUploadError(`file too large: ${data.byteLength} bytes`);
  }

  const ext =
    contentType === "image/png"
      ? "png"
      : contentType === "image/webp"
        ? "webp"
        : "jpg";
  const key = `avatars/${userId}/${Date.now()}.${ext}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: env.AVATARS_S3_BUCKET,
      Key: key,
      Body: data,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );

  // CloudFront /avatars/* behavior가 같은 도메인에서 서빙 — WEB_ORIGIN 기반 절대 URL
  return `${env.WEB_ORIGIN}/${key}`;
}

/**
 * 옛 아바타 삭제 (재업로드 시 호출). avatarUrl이 우리 도메인 아니면 무시.
 */
export async function deleteAvatarByUrl(url: string | null): Promise<void> {
  if (!url) return;
  const prefix = `${env.WEB_ORIGIN}/`;
  if (!url.startsWith(prefix)) return;
  const key = url.slice(prefix.length);
  if (!key.startsWith("avatars/")) return;

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: env.AVATARS_S3_BUCKET,
        Key: key,
      }),
    );
  } catch (err) {
    // 삭제 실패는 치명적 X — 로그만 남기고 진행 (lifecycle이 결국 정리)
    console.warn(`[avatars] delete failed for ${key}:`, err);
  }
}
