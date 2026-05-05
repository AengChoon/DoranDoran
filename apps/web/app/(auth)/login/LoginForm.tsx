"use client";
import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  pinRequestSchema,
  pinVerifyRequestSchema,
} from "@dorandoran/shared";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiFetch, ApiError } from "@/lib/api/client";
import { meKey } from "@/lib/api/me";

type Step =
  | { kind: "email" }
  | { kind: "pin"; email: string; devCode?: string };

/**
 * 2-step 로그인:
 *  1) 이메일 입력 → POST /auth/request-pin → PIN 단계
 *  2) PIN 입력 → POST /auth/verify-pin → 쿠키 set → /feed (AuthGuard가 onboarding 체크)
 *
 * 같은 브라우저에서 처리되므로 메일 클라이언트가 다른 브라우저로 열려도 OK.
 */
export function LoginForm() {
  const router = useRouter();
  const qc = useQueryClient();

  const [step, setStep] = React.useState<Step>({ kind: "email" });
  const [email, setEmail] = React.useState("");
  const [code, setCode] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onRequestPin(e: React.FormEvent) {
    e.preventDefault();
    const parsed = pinRequestSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "이메일을 다시 확인해주세요");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await apiFetch<{ ok: true; devCode?: string }>(
        "/auth/request-pin",
        {
          method: "POST",
          body: JSON.stringify({ email: parsed.data.email }),
        },
      );
      setStep({ kind: "pin", email: parsed.data.email, devCode: data?.devCode });
      setCode("");
    } catch {
      // 네트워크 실패해도 다음 단계로 — 이메일 존재 여부 노출 X
      setStep({ kind: "pin", email: parsed.data.email });
      setCode("");
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyPin(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== "pin") return;
    const parsed = pinVerifyRequestSchema.safeParse({ email: step.email, code });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "코드를 다시 확인해주세요");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch<{ ok: true }>("/auth/verify-pin", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      // 세션 쿠키 set 됨 → me 갱신 후 라우터 푸시. AuthGuard가 onboarding 체크.
      await qc.invalidateQueries({ queryKey: meKey });
      router.replace("/feed");
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 400
          ? "코드가 맞지 않거나 만료됐어요"
          : "확인 중 문제가 생겼어요";
      setError(msg);
      setSubmitting(false);
    }
  }

  if (step.kind === "pin") {
    return (
      <form onSubmit={onVerifyPin} className="flex flex-col gap-3">
        <p className="text-center text-sm text-duo-text-muted font-semibold">
          <span className="text-duo-text font-bold">{step.email}</span>로<br />
          6자리 코드를 보냈어요.
        </p>
        <label htmlFor="pin" className="sr-only">로그인 코드</label>
        <Input
          id="pin"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          placeholder="● ● ● ● ● ●"
          value={code}
          onChange={(e) => {
            // 숫자만 허용 + 6자리 cap
            const next = e.target.value.replace(/\D/g, "").slice(0, 6);
            setCode(next);
            if (error) setError(null);
          }}
          aria-invalid={error != null}
          required
          autoFocus
          className="text-center text-2xl tracking-[0.4em] font-extrabold"
        />

        {step.devCode && (
          <button
            type="button"
            onClick={() => setCode(step.devCode!)}
            className="btn-duo bg-duo-yellow text-white shadow-[0_4px_0_0_#E0A800] active:shadow-[0_0_0_0_#E0A800] hover:brightness-105 h-12 px-5 text-base"
          >
            🚀 dev 코드 자동 입력 ({step.devCode})
          </button>
        )}

        {error && (
          <p className="text-duo-red font-bold text-sm px-1" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" size="block" disabled={submitting || code.length !== 6}>
          {submitting ? "확인 중…" : "로그인"}
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setStep({ kind: "email" });
            setCode("");
            setError(null);
          }}
        >
          다른 이메일로 다시 시도
        </Button>
      </form>
    );
  }

  return (
    <form onSubmit={onRequestPin} className="flex flex-col gap-3">
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
          if (error) setError(null);
        }}
        aria-invalid={error != null}
        required
      />

      {error && (
        <p className="text-duo-red font-bold text-sm px-1" role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="block" disabled={submitting}>
        {submitting ? "보내는 중…" : "코드 받기"}
      </Button>
    </form>
  );
}
