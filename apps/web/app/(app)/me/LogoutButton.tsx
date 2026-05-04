"use client";
import { Button } from "@/components/ui/Button";
import { clearLocalDb } from "@/lib/local/db";

export function LogoutButton() {
  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
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
