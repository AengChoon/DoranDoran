"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { LocaleToggle } from "@/components/LocaleToggle";
import { Mascot } from "@/components/Mascot";
import { Wordmark } from "@/components/Wordmark";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useMe, meKey } from "@/lib/api/me";
import { apiFetch } from "@/lib/api/client";
import { format, useT } from "@/lib/i18n";

/**
 * 첫 로그인 후 본인 프로필 셋업 — name, native lang, avatar.
 *
 * 라우팅:
 *  - 로그아웃 상태 → /login
 *  - 이미 onboarded → /feed
 *  - 미완료 → 이 페이지 렌더
 */
export default function OnboardingPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const me = useMe();

  React.useEffect(() => {
    if (me.isLoading) return;
    if (!me.user) router.replace("/login");
    else if (me.user.onboardedAt != null) router.replace("/feed");
  }, [me.isLoading, me.user, router]);

  if (me.isLoading || !me.user || me.user.onboardedAt != null) {
    return (
      <main className="h-full flex items-center justify-center px-4">
        <Skeleton className="h-64 w-full max-w-md" />
      </main>
    );
  }

  return <OnboardingForm initialName={me.user.displayName} initialNative={me.user.nativeLang} initialAvatarUrl={me.user.avatarUrl} onDone={async () => {
    await qc.invalidateQueries({ queryKey: meKey });
    router.replace("/feed");
  }} />;
}

type Props = {
  initialName: string;
  initialNative: "ko" | "ja";
  initialAvatarUrl: string | null;
  onDone: () => void | Promise<void>;
};

function OnboardingForm({ initialName, initialNative, initialAvatarUrl, onDone }: Props) {
  const t = useT();
  const [name, setName] = React.useState(initialName);
  const [native, setNative] = React.useState<"ko" | "ja">(initialNative);
  const [avatarFile, setAvatarFile] = React.useState<Blob | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(initialAvatarUrl);
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // learning lang은 native의 반대 — 한·일 커플 가정
  const learning: "ko" | "ja" = native === "ko" ? "ja" : "ko";

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError(t.onboarding.imagesOnly);
      return;
    }
    try {
      const resized = await resizeImage(file, 512);
      setAvatarFile(resized);
      setAvatarPreview(URL.createObjectURL(resized));
      setError(null);
    } catch {
      setError(t.onboarding.imageLoadFail);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError(t.onboarding.nameRequired);
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      // 1) 프로필 텍스트 필드 저장 — onboardedAt 도 여기서 설정됨
      await apiFetch<{ ok: true }>("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          displayName: name.trim(),
          nativeLang: native,
          learningLang: learning,
        }),
      });

      // 2) 사진이 있으면 업로드 (옵션)
      if (avatarFile) {
        const fd = new FormData();
        fd.append("avatar", avatarFile, "avatar.jpg");
        await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8787"}/auth/me/avatar`,
          { method: "POST", body: fd, credentials: "include" },
        );
        // 실패해도 onboarding은 완료 — 사진은 나중에 다시 업로드 가능
      }

      await onDone();
    } catch {
      setError(t.onboarding.saveError);
      setSubmitting(false);
    }
  }

  return (
    <main
      className="h-full flex flex-col items-center justify-center px-4 bg-linear-to-b from-duo-bg to-duo-green/5"
      style={{
        paddingTop: "max(env(safe-area-inset-top), clamp(0.75rem, 3vh, 2rem))",
        paddingBottom: "max(env(safe-area-inset-bottom), clamp(0.75rem, 3vh, 2rem))",
      }}
    >
      {/* 우상단 locale 토글 — onboarding 중에도 언어 변경 가능 */}
      <div
        className="absolute right-3 flex"
        style={{ top: "max(env(safe-area-inset-top), 0.75rem)" }}
      >
        <LocaleToggle />
      </div>

      <div className="w-full max-w-md flex flex-col items-center gap-[clamp(0.75rem,2.5vh,1.5rem)]">
        <div className="flex flex-col items-center gap-1">
          <div className="w-[clamp(6rem,18vh,10rem)]">
            <Mascot variant="pair-celebrate" size="lg" className="!w-full !h-auto" />
          </div>
          <Wordmark size="lg" />
        </div>

        <h1 className="text-xl font-extrabold text-duo-text">{t.onboarding.welcome}</h1>

        <form onSubmit={onSubmit} className="w-full flex flex-col gap-4">
          {/* 아바타 — 옵션 */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="self-center relative h-24 w-24 rounded-full bg-duo-bg-muted border-2 border-duo-border overflow-hidden flex items-center justify-center text-duo-text-muted active:scale-95 transition-transform"
            aria-label={t.onboarding.avatarLabel}
          >
            {avatarPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
            ) : (
              <Camera className="h-8 w-8" strokeWidth={2} aria-hidden />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
          <p className="-mt-2 text-center text-xs font-semibold text-duo-text-muted">
            {t.onboarding.avatarHelper}
          </p>

          {/* 이름 */}
          <div>
            <label htmlFor="name" className="block text-sm font-extrabold text-duo-text mb-1.5">
              {t.onboarding.nameLabel}
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.onboarding.namePlaceholder}
              maxLength={40}
              required
              autoFocus
            />
          </div>

          {/* 모국어 */}
          <div>
            <label className="block text-sm font-extrabold text-duo-text mb-1.5">
              {t.onboarding.nativeLangLabel}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <LangPill active={native === "ko"} onClick={() => setNative("ko")}>
                {t.onboarding.langKo}
              </LangPill>
              <LangPill active={native === "ja"} onClick={() => setNative("ja")}>
                {t.onboarding.langJa}
              </LangPill>
            </div>
            <p className="mt-1.5 text-xs text-duo-text-muted font-semibold">
              {format(t.onboarding.learningHint, {
                lang:
                  learning === "ko"
                    ? t.onboarding.langKoName
                    : t.onboarding.langJaName,
              })}
            </p>
          </div>

          {error && (
            <p className="text-sm font-bold text-duo-red px-1" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" size="block" disabled={submitting}>
            {submitting ? t.onboarding.savingCta : t.onboarding.startCta}
          </Button>
        </form>
      </div>
    </main>
  );
}

function LangPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? "h-12 rounded-duo-sm border-2 border-duo-blue bg-duo-blue/10 text-duo-blue-dark font-extrabold transition-colors"
          : "h-12 rounded-duo-sm border-2 border-duo-border bg-white text-duo-text font-bold hover:bg-duo-bg-muted transition-colors"
      }
      aria-pressed={active}
    >
      {children}
    </button>
  );
}

/** 이미지 클라이언트 측 리사이즈 — 최대 변 maxSize, JPEG 0.85 */
async function resizeImage(file: File, maxSize: number): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const ratio = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * ratio);
  const h = Math.round(bitmap.height * ratio);

  // OffscreenCanvas 우선, 없으면 일반 canvas fallback
  if (typeof OffscreenCanvas !== "undefined") {
    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no 2d ctx");
    ctx.drawImage(bitmap, 0, 0, w, h);
    return await canvas.convertToBlob({ type: "image/jpeg", quality: 0.85 });
  }
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no 2d ctx");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("toBlob failed"))),
      "image/jpeg",
      0.85,
    );
  });
}
