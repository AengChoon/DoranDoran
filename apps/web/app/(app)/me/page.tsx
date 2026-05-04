import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { Mascot } from "@/components/Mascot";
import { LogoutButton } from "./LogoutButton";

export const metadata: Metadata = {
  title: "나",
};

type Me = {
  user: {
    id: string;
    email: string;
    displayName: string;
    nativeLang: "ko" | "ja";
    learningLang: "ko" | "ja";
  };
};

async function fetchMe(cookie: string): Promise<Me | null> {
  const apiBase = process.env.API_INTERNAL_BASE ?? "http://localhost:8787";
  try {
    const res = await fetch(`${apiBase}/auth/me`, {
      headers: { cookie },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as Me;
  } catch {
    return null;
  }
}

export default async function MePage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");

  const me = await fetchMe(cookieHeader);
  if (!me) redirect("/login");

  return (
    <main className="max-w-md mx-auto px-4 py-10 flex flex-col items-center gap-6">
      <Mascot variant="pair" size="md" />

      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-duo-text">
          {me.user.displayName}
        </h1>
        <p className="mt-1 text-sm text-duo-text-muted">{me.user.email}</p>
      </div>

      <div className="card-duo w-full">
        <Row label="학습 언어">
          {me.user.learningLang === "ja" ? "일본어" : "한국어"}
        </Row>
        <Row label="모국어">
          {me.user.nativeLang === "ja" ? "일본어" : "한국어"}
        </Row>
      </div>

      <LogoutButton />
    </main>
  );
}

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-duo-border last:border-b-0">
      <span className="text-sm font-bold text-duo-text-muted">{label}</span>
      <span className="text-sm font-extrabold text-duo-text">{children}</span>
    </div>
  );
}
