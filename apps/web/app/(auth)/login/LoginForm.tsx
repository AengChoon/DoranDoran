"use client";
import * as React from "react";
import { MailCheck } from "lucide-react";
import { magicLinkRequestSchema } from "@dorandoran/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch } from "@/lib/api/client";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "sent"; email: string; devLink?: string }
  | { kind: "error"; message: string };

export function LoginForm() {
  const [email, setEmail] = React.useState("");
  const [status, setStatus] = React.useState<Status>({ kind: "idle" });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = magicLinkRequestSchema.safeParse({ email });
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      setStatus({ kind: "error", message: issue?.message ?? "이메일을 다시 확인해주세요" });
      return;
    }

    setStatus({ kind: "loading" });
    try {
      // 정적 export 호스팅 — apiFetch가 NEXT_PUBLIC_API_BASE로 cross-origin 호출.
      // SameSite=Lax + 같은 eTLD+1로 cookie 처리 OK.
      // dev 모드면 응답에 devLink 포함 → "메일 보냈어요" 화면에서 즉시 로그인 가능
      const data = await apiFetch<{ ok: true; devLink?: string }>(
        "/auth/magic-link",
        {
          method: "POST",
          body: JSON.stringify({ email: parsed.data.email }),
        },
      );
      setStatus({ kind: "sent", email: parsed.data.email, devLink: data?.devLink });
    } catch {
      // 네트워크 실패해도 이메일 존재 여부 노출 안 함 — UX는 동일
      setStatus({ kind: "sent", email: parsed.data.email });
    }
  }

  if (status.kind === "sent") {
    return (
      <div className="card-duo flex flex-col items-center gap-3 py-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-duo-green/10">
          <MailCheck
            className="h-8 w-8 text-duo-green-dark"
            strokeWidth={2.2}
            aria-hidden
          />
        </div>
        <h2 className="text-xl font-extrabold text-duo-green-dark">메일을 보냈어요</h2>
        <p className="text-duo-text-muted text-sm font-semibold">
          <span className="text-duo-text font-bold">{status.email}</span>로<br />
          도란도란 시작 링크를 보냈어요.<br />
          메일함을 확인해주세요.
        </p>
        {status.devLink && (
          <a
            href={status.devLink}
            className="btn-duo bg-duo-yellow text-white shadow-[0_4px_0_0_#E0A800] active:shadow-[0_0_0_0_#E0A800] hover:brightness-105 h-12 px-5 text-base mt-2 w-full"
          >
            🚀 dev 즉시 로그인
          </a>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setStatus({ kind: "idle" })}
          className="mt-2"
        >
          다른 이메일로 다시 시도
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <label htmlFor="email" className="sr-only">이메일</label>
      <Input
        id="email"
        type="email"
        inputMode="email"
        autoComplete="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (status.kind === "error") setStatus({ kind: "idle" });
        }}
        aria-invalid={status.kind === "error"}
        required
      />

      {status.kind === "error" && (
        <p className="text-duo-red font-bold text-sm px-1" role="alert">
          {status.message}
        </p>
      )}

      <Button
        type="submit"
        size="block"
        disabled={status.kind === "loading"}
      >
        {status.kind === "loading" ? "보내는 중…" : "오늘도 도란도란 시작하기"}
      </Button>
    </form>
  );
}
