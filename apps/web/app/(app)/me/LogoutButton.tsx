"use client";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api/client";
import { clearLocalDb } from "@/lib/local/db";

export function LogoutButton() {
  async function logout() {
    try {
      // 정적 export — apiFetch가 NEXT_PUBLIC_API_BASE로 cross-origin 호출, 쿠키 클리어
      await apiFetch<{ ok: true }>("/auth/logout", { method: "POST" });
    } catch {
      // 네트워크 실패해도 로컬은 비움
    }
    // 로컬 DB도 비움 — 다른 계정으로 로그인 가능성 + 보안
    try {
      await clearLocalDb();
    } catch {
      // ignore
    }
    window.location.href = "/login";
  }
  return (
    <Button variant="ghost" size="lg" onClick={logout}>
      로그아웃
    </Button>
  );
}
